import { randomUUID } from "node:crypto";
import { sql, databaseReady } from "./database.js";
import { decodePayload } from "./jobs.js";

const workerId=`worker-${randomUUID()}`,scannerUrl=process.env.MALWARE_SCAN_URL,scannerToken=process.env.MALWARE_SCAN_TOKEN;

async function claim(){
  const job=await sql.one("SELECT * FROM jobs WHERE status='queued' AND available_at<=CURRENT_TIMESTAMP ORDER BY created_at LIMIT 1");
  if(!job)return null;
  await sql.run("UPDATE jobs SET status='running',locked_at=CURRENT_TIMESTAMP,locked_by=?,attempts=attempts+1 WHERE id=? AND status='queued'",workerId,job.id);
  return await sql.one("SELECT * FROM jobs WHERE id=? AND locked_by=? AND status='running'",job.id,workerId);
}

async function scanUpload(payload){
  if(!scannerUrl)throw new Error("MALWARE_SCAN_URL is not configured");
  const response=await fetch(scannerUrl,{method:"POST",headers:{"content-type":"application/json",...(scannerToken?{authorization:`Bearer ${scannerToken}`}:{})},body:JSON.stringify(payload),signal:AbortSignal.timeout(60_000)});
  if(!response.ok)throw new Error(`Scanner returned ${response.status}`);
  const result=await response.json();
  if(!result.clean){await sql.run("UPDATE upload_intents SET status='rejected',scan_result=? WHERE id=?",JSON.stringify(result),payload.uploadId);return}
  await sql.transaction(async tx=>{
    await tx.run("UPDATE upload_intents SET status='clean',object_key=?,scan_result=? WHERE id=?",result.sanitizedObjectKey||payload.objectKey,JSON.stringify(result),payload.uploadId);
    const binding=await tx.one("SELECT * FROM upload_bindings WHERE upload_id=?",payload.uploadId);
    if(binding?.target_type==="listing_media"){const upload=await tx.one("SELECT * FROM upload_intents WHERE id=?",payload.uploadId);await tx.run("INSERT INTO listing_media(id,listing_id,media_type,storage_key,moderation_status,perceptual_hash) VALUES(?,?,?,?,?,?) ON CONFLICT DO NOTHING",upload.id,binding.target_id,upload.content_type.startsWith("video/")?"video":"image",upload.object_key,"approved",result.perceptualHash||null)}
  });
}

async function deliver(kind,payload){
  const sms=kind==="send_sms",endpoint=process.env[sms?"SMS_PROVIDER_URL":"EMAIL_PROVIDER_URL"],token=process.env[sms?"SMS_PROVIDER_KEY":"EMAIL_PROVIDER_KEY"];
  if(!endpoint||!token)throw new Error(`${sms?"SMS":"EMAIL"} provider is not configured`);
  const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${token}`},body:JSON.stringify(sms?{to:payload.destination,template:"roombridge_verification",variables:{code:payload.code,expires:payload.expires}}:{to:payload.destination,template:payload.purpose==="password_reset"?"roombridge_password_reset":"roombridge_verification",variables:{code:payload.code,expires:payload.expires}}),signal:AbortSignal.timeout(15_000)});
  if(!response.ok)throw new Error(`Delivery provider returned ${response.status}`);
}

async function work(job){
  const payload=decodePayload(job.payload);
  if(job.kind==="scan_upload")await scanUpload(payload);
  else if(job.kind==="send_email"||job.kind==="send_sms")await deliver(job.kind,payload);
  else throw new Error(`Unknown job kind: ${job.kind}`);
  await sql.run("UPDATE jobs SET status='completed',payload='{}',completed_at=CURRENT_TIMESTAMP,locked_at=NULL,locked_by=NULL WHERE id=?",job.id);
}

async function main(){
  await databaseReady;
  console.log(JSON.stringify({level:"info",message:"worker_started",workerId}));
  for(;;){
    const job=await claim();
    if(!job){await new Promise(resolve=>setTimeout(resolve,1000));continue}
    try{await work(job)}
    catch(error){
      const terminal=Number(job.attempts)>=5,next=new Date(Date.now()+Math.min(300_000,2**Number(job.attempts)*1000)).toISOString();
      await sql.run("UPDATE jobs SET status=?,available_at=?,locked_at=NULL,locked_by=NULL,last_error=? WHERE id=?",terminal?"failed":"queued",next,String(error.message).slice(0,1000),job.id);
      console.error(JSON.stringify({level:"error",message:"job_failed",jobId:job.id,kind:job.kind,error:error.message,terminal}));
    }
  }
}

main().catch(error=>{console.error(JSON.stringify({level:"fatal",message:"worker_crashed",error:error.message,stack:error.stack}));process.exitCode=1});
