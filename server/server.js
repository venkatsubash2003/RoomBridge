import http from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { sql } from "./database.js";
import { passwordHash,passwordValid,createSession,sessionUser,clearSession,issueCode,consumeCode,randomUUID } from "./auth.js";
import { scoreProfiles } from "./services/matching.js";
import { fraudSignal,translate,personalizedRerank } from "./services/ai.js";
import { commuteEstimate } from "./services/maps.js";
import { notify } from "./services/notifications.js";

const root=resolve(import.meta.dirname,".."),port=Number(process.env.PORT||8080),host=process.env.HOST||"127.0.0.1",streams=new Map();
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json",".svg":"image/svg+xml"};
const json=(res,status,data,headers={})=>{res.writeHead(status,{"Content-Type":"application/json",...headers});res.end(JSON.stringify(data))};
const cookie=session=>`rb_session=${encodeURIComponent(session.token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${process.env.NODE_ENV==='production'?'; Secure':''}`;
async function body(req){let raw="";for await(const chunk of req){raw+=chunk;if(raw.length>1e6)throw new Error("Request too large")}return raw?JSON.parse(raw):{}}
const publicUser=u=>u&&({id:u.id,email:u.email,name:u.name,phone:u.phone,emailVerified:!!u.email_verified,phoneVerified:!!u.phone_verified,institutionVerified:!!u.institution_verified,reputation:u.reputation,locale:u.locale,currency:u.currency});
function requireUser(req,res){const user=sessionUser(req);if(!user)json(res,401,{error:"Authentication required"});return user}
function emit(userId,event,payload){const clients=streams.get(userId)||[];for(const res of clients)res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`)}
function parseProfile(row){return row&&{...row,languages:JSON.parse(row.languages||"[]"),lifestyle:JSON.parse(row.lifestyle||"{}"),weights:JSON.parse(row.preference_weights||"{}"),dealBreakers:JSON.parse(row.deal_breakers||"{}")}}

async function api(req,res,url){
  if(req.method==="GET"&&url.pathname==="/api/health")return json(res,200,{ok:true,database:"sqlite",realtime:"sse",ai:process.env.OPENAI_API_KEY?"configured":"fallback"});
  if(req.method==="POST"&&url.pathname==="/api/auth/register"){
    const d=await body(req);if(!d.email||!d.name||!/(?=.*[A-Za-z])(?=.*\d).{8,}/.test(d.password||""))return json(res,400,{error:"Name, valid email, and strong password required"});
    const id=randomUUID();try{sql.run("INSERT INTO users(id,email,password_hash,name) VALUES(?,?,?,?)",id,d.email.trim().toLowerCase(),passwordHash(d.password),d.name.trim())}catch{return json(res,409,{error:"Account already exists"})}
    const verification=issueCode(id,d.email,"email");return json(res,201,{userId:id,verificationId:verification.id,...(process.env.NODE_ENV==='production'?{}:{demoCode:verification.code})});
  }
  if(req.method==="POST"&&url.pathname==="/api/auth/verify"){
    const d=await body(req),v=consumeCode(d.verificationId,d.code);if(!v)return json(res,400,{error:"Invalid or expired code"});
    if(v.purpose==="email")sql.run("UPDATE users SET email_verified=1 WHERE id=?",v.user_id);if(v.purpose==="phone")sql.run("UPDATE users SET phone_verified=1,phone=? WHERE id=?",v.destination,v.user_id);if(v.purpose==="institution")sql.run("UPDATE users SET institution_verified=1 WHERE id=?",v.user_id);
    const session=createSession(v.user_id);return json(res,200,{user:publicUser(sql.one("SELECT * FROM users WHERE id=?",v.user_id))},{"Set-Cookie":cookie(session)});
  }
  if(req.method==="POST"&&url.pathname==="/api/auth/login"){
    const d=await body(req),u=sql.one("SELECT * FROM users WHERE email=?",String(d.email||"").toLowerCase());if(!u||!passwordValid(d.password||"",u.password_hash))return json(res,401,{error:"Invalid credentials"});if(!u.email_verified)return json(res,403,{error:"Email verification required"});const session=createSession(u.id);return json(res,200,{user:publicUser(u)},{"Set-Cookie":cookie(session)});
  }
  if(req.method==="POST"&&url.pathname==="/api/auth/resend"){
    const d=await body(req),previous=sql.one("SELECT user_id,destination,purpose FROM verification_codes WHERE id=?",d.verificationId);if(!previous)return json(res,404,{error:"Verification request not found"});const v=issueCode(previous.user_id,previous.destination,previous.purpose);return json(res,201,{verificationId:v.id,...(process.env.NODE_ENV==='production'?{}:{demoCode:v.code})});
  }
  if(req.method==="POST"&&url.pathname==="/api/auth/logout"){clearSession(req);return json(res,200,{ok:true},{"Set-Cookie":"rb_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax"})}
  if(req.method==="GET"&&url.pathname==="/api/auth/me"){const u=requireUser(req,res);if(u)return json(res,200,{user:publicUser(u)})}
  if(req.method==="POST"&&url.pathname==="/api/auth/request-verification"){const u=requireUser(req,res);if(!u)return;const d=await body(req),v=issueCode(u.id,d.destination,d.purpose);return json(res,201,{verificationId:v.id,...(process.env.NODE_ENV==='production'?{}:{demoCode:v.code})})}
  if(req.method==="GET"&&url.pathname==="/api/events"){const u=requireUser(req,res);if(!u)return;res.writeHead(200,{"Content-Type":"text/event-stream","Cache-Control":"no-cache","Connection":"keep-alive"});res.write(`event: ready\ndata: {"ok":true}\n\n`);const clients=streams.get(u.id)||[];clients.push(res);streams.set(u.id,clients);req.on("close",()=>streams.set(u.id,(streams.get(u.id)||[]).filter(x=>x!==res)));return}

  const u=requireUser(req,res);if(!u)return;
  if(url.pathname==="/api/profile"&&req.method==="GET")return json(res,200,{profile:parseProfile(sql.one("SELECT * FROM profiles WHERE user_id=?",u.id))});
  if(url.pathname==="/api/profile"&&req.method==="PUT"){
    const d=await body(req);sql.run(`INSERT INTO profiles(user_id,scenario,city,budget,room_type,move_date,lease_duration,country,diet,languages,bio,lifestyle,preference_weights,deal_breakers,public_status)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET scenario=excluded.scenario,city=excluded.city,budget=excluded.budget,room_type=excluded.room_type,move_date=excluded.move_date,lease_duration=excluded.lease_duration,country=excluded.country,diet=excluded.diet,languages=excluded.languages,bio=excluded.bio,lifestyle=excluded.lifestyle,preference_weights=excluded.preference_weights,deal_breakers=excluded.deal_breakers,public_status=excluded.public_status,updated_at=CURRENT_TIMESTAMP`,u.id,d.scenario,d.city,d.budget,d.roomType,d.moveDate,d.leaseDuration,d.country,d.diet,JSON.stringify(d.languages||[]),d.bio,JSON.stringify(d.lifestyle||{}),JSON.stringify(d.weights||{}),JSON.stringify(d.dealBreakers||{}),d.publicStatus);return json(res,200,{ok:true});
  }
  if(url.pathname==="/api/listings"&&req.method==="POST"){
    const d=await body(req),id=randomUUID();sql.run(`INSERT INTO listings(id,owner_id,title,description,category,city,neighborhood,exact_address,rent,deposit,available_date,lease_duration,furnished,utilities,parking,laundry,accessibility,amenities,latitude,longitude) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,id,u.id,d.title,d.description,d.category,d.city,d.neighborhood,d.exactAddress,d.rent,d.deposit,d.availableDate,d.leaseDuration,d.furnished,d.utilities,d.parking,d.laundry,d.accessibility,JSON.stringify(d.amenities||[]),d.latitude,d.longitude);notify(u.id,"listing","Listing submitted","Your listing is awaiting moderation.");return json(res,201,{id,status:"pending_review"});
  }
  if(url.pathname==="/api/listings"&&req.method==="GET"){
    const q=[],p=[];q.push("status='active'");for(const [key,col,op] of [["city","city","="],["category","category","="],["maxRent","rent","<="]])if(url.searchParams.get(key)){q.push(`${col}${op}?`);p.push(url.searchParams.get(key))}if(url.searchParams.get("moveBy")){q.push("available_date<=?");p.push(url.searchParams.get("moveBy"))}const rows=sql.all(`SELECT id,owner_id,title,description,category,city,neighborhood,rent,deposit,available_date,lease_duration,furnished,utilities,parking,laundry,accessibility,amenities,latitude,longitude,verification_status FROM listings WHERE ${q.join(" AND ")} ORDER BY created_at DESC`,...p).map(x=>({...x,amenities:JSON.parse(x.amenities||"[]")}));return json(res,200,{listings:rows});
  }
  if(url.pathname==="/api/saved-searches"&&req.method==="POST"){const d=await body(req),id=randomUUID();sql.run("INSERT INTO saved_searches(id,user_id,name,filters,alerts_enabled) VALUES(?,?,?,?,?)",id,u.id,d.name,JSON.stringify(d.filters||{}),d.alertsEnabled===false?0:1);return json(res,201,{id})}
  if(url.pathname==="/api/saved-searches"&&req.method==="GET")return json(res,200,{searches:sql.all("SELECT * FROM saved_searches WHERE user_id=? ORDER BY created_at DESC",u.id).map(x=>({...x,filters:JSON.parse(x.filters)}))});
  if(url.pathname==="/api/matches"&&req.method==="GET"){
    const mine=parseProfile(sql.one("SELECT * FROM profiles WHERE user_id=?",u.id));if(!mine)return json(res,400,{error:"Complete profile first"});const candidates=sql.all("SELECT p.*,u.name,u.reputation FROM profiles p JOIN users u ON u.id=p.user_id WHERE p.user_id<>?",u.id).map(parseProfile);const results=[];for(const c of candidates){const feedback=sql.one("SELECT feedback FROM match_feedback WHERE user_id=? AND candidate_id=?",u.id,c.user_id)?.feedback;results.push({...c,...scoreProfiles(mine,c,feedback)})}return json(res,200,{matches:await personalizedRerank(results)});
  }
  if(url.pathname==="/api/match-feedback"&&req.method==="POST"){const d=await body(req);sql.run("INSERT INTO match_feedback(user_id,candidate_id,feedback) VALUES(?,?,?) ON CONFLICT(user_id,candidate_id) DO UPDATE SET feedback=excluded.feedback,created_at=CURRENT_TIMESTAMP",u.id,d.candidateId,d.feedback);return json(res,200,{ok:true})}
  if(url.pathname==="/api/conversations"&&req.method==="POST"){const d=await body(req),id=randomUUID();sql.transaction(()=>{sql.run("INSERT INTO conversations(id,kind,title,created_by) VALUES(?,?,?,?)",id,d.kind||"private",d.title,u.id);for(const member of new Set([u.id,...(d.memberIds||[])]))sql.run("INSERT INTO conversation_members(conversation_id,user_id) VALUES(?,?)",id,member)});return json(res,201,{id})}
  if(url.pathname==="/api/conversations"&&req.method==="GET")return json(res,200,{conversations:sql.all(`SELECT c.*,cm.last_read_at,(SELECT body FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) last_message FROM conversations c JOIN conversation_members cm ON cm.conversation_id=c.id WHERE cm.user_id=? AND cm.blocked_at IS NULL`,u.id)});
  const msgMatch=url.pathname.match(/^\/api\/conversations\/([^/]+)\/messages$/);if(msgMatch&&req.method==="GET"){const member=sql.one("SELECT 1 FROM conversation_members WHERE conversation_id=? AND user_id=?",msgMatch[1],u.id);if(!member)return json(res,403,{error:"Forbidden"});return json(res,200,{messages:sql.all("SELECT * FROM messages WHERE conversation_id=? ORDER BY created_at",msgMatch[1])})}
  if(msgMatch&&req.method==="POST"){const member=sql.one("SELECT blocked_at FROM conversation_members WHERE conversation_id=? AND user_id=?",msgMatch[1],u.id);if(!member||member.blocked_at)return json(res,403,{error:"Conversation unavailable"});const d=await body(req),risk=await fraudSignal(d.body||""),id=randomUUID();sql.run("INSERT INTO messages(id,conversation_id,sender_id,body,attachment_key,risk_score) VALUES(?,?,?,?,?,?)",id,msgMatch[1],u.id,d.body,d.attachmentKey,risk.score);const recipients=sql.all("SELECT user_id FROM conversation_members WHERE conversation_id=? AND user_id<>? AND blocked_at IS NULL",msgMatch[1],u.id);for(const r of recipients){notify(r.user_id,"message",`New message from ${u.name}`,risk.score>=.5?"Potential payment risk detected":d.body);emit(r.user_id,"message",{id,conversationId:msgMatch[1],senderId:u.id,body:d.body,risk})}return json(res,201,{id,risk})}
  const blockMatch=url.pathname.match(/^\/api\/conversations\/([^/]+)\/block$/);if(blockMatch&&req.method==="POST"){sql.run("UPDATE conversation_members SET blocked_at=CURRENT_TIMESTAMP WHERE conversation_id=? AND user_id=?",blockMatch[1],u.id);return json(res,200,{ok:true})}
  if(url.pathname==="/api/reports"&&req.method==="POST"){const d=await body(req),id=randomUUID();sql.run("INSERT INTO reports(id,reporter_id,target_type,target_id,category,details,risk) VALUES(?,?,?,?,?,?,?)",id,u.id,d.targetType,d.targetId,d.category,d.details,d.risk||"medium");return json(res,201,{id,status:"new"})}
  if(url.pathname==="/api/verifications"&&req.method==="POST"){const d=await body(req);if(!["identity","institution","listing"].includes(d.subjectType))return json(res,400,{error:"Invalid verification type"});if(d.subjectType==="listing"&&!sql.one("SELECT 1 FROM listings WHERE id=? AND owner_id=?",d.subjectId,u.id))return json(res,403,{error:"Only the listing owner may request verification"});const id=randomUUID();sql.run("INSERT INTO verification_requests(id,user_id,subject_type,subject_id,document_key) VALUES(?,?,?,?,?)",id,u.id,d.subjectType,d.subjectId,d.documentKey);return json(res,201,{id,status:"pending",privacy:"Documents remain private and are never added to public profiles"})}
  if(url.pathname==="/api/verifications"&&req.method==="GET")return json(res,200,{requests:sql.all("SELECT id,subject_type,subject_id,status,decision_reason,created_at,reviewed_at FROM verification_requests WHERE user_id=? ORDER BY created_at DESC",u.id)});
  if(url.pathname==="/api/households"&&req.method==="POST"){const d=await body(req),id=randomUUID();sql.transaction(()=>{sql.run("INSERT INTO households(id,name,created_by) VALUES(?,?,?)",id,d.name,u.id);sql.run("INSERT INTO household_members(household_id,user_id,role) VALUES(?,?,?)",id,u.id,"owner")});return json(res,201,{id})}
  const householdMatch=url.pathname.match(/^\/api\/households\/([^/]+)\/members$/);if(householdMatch&&req.method==="POST"){const d=await body(req);sql.run("INSERT OR IGNORE INTO household_members(household_id,user_id) VALUES(?,?)",householdMatch[1],d.userId);return json(res,200,{ok:true})}
  if(url.pathname==="/api/lease-workflows"&&req.method==="POST"){const d=await body(req),id=randomUUID();sql.run("INSERT INTO lease_workflows(id,listing_id,outgoing_user_id,incoming_user_id,transfer_type,replacement_date,fee,landlord_status,steps) VALUES(?,?,?,?,?,?,?,?,?)",id,d.listingId,u.id,d.incomingUserId,d.transferType,d.replacementDate,d.fee,d.landlordStatus||"not_contacted",JSON.stringify(d.steps||{}));return json(res,201,{id})}
  if(url.pathname==="/api/commute"&&req.method==="GET")return json(res,200,commuteEstimate(url.searchParams.get("from")||"",url.searchParams.get("to")||""));
  if(url.pathname==="/api/notifications"&&req.method==="GET")return json(res,200,{notifications:sql.all("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100",u.id)});
  if(url.pathname==="/api/ai/translate"&&req.method==="POST"){const d=await body(req);return json(res,200,await translate(d.text,d.targetLanguage))}
  if(url.pathname==="/api/ai/fraud-check"&&req.method==="POST"){const d=await body(req);return json(res,200,await fraudSignal(d.text))}
  return json(res,404,{error:"API route not found"});
}

function staticFile(req,res,url){let path=url.pathname==="/"?"/index.html":decodeURIComponent(url.pathname);const file=resolve(root,`.${path}`);if(!file.startsWith(root+sep)||!existsSync(file)||!statSync(file).isFile())return json(res,404,{error:"Not found"});res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream","Cache-Control":path.endsWith(".html")?"no-cache":"public, max-age=3600","X-Content-Type-Options":"nosniff","Referrer-Policy":"same-origin","X-Frame-Options":"DENY"});res.end(readFileSync(file))}
const server=http.createServer(async(req,res)=>{const url=new URL(req.url,`http://${req.headers.host||"localhost"}`);try{if(url.pathname.startsWith("/api/"))await api(req,res,url);else staticFile(req,res,url)}catch(error){console.error(error);if(!res.headersSent)json(res,500,{error:"Internal server error"});else res.end()}});
server.listen(port,host,()=>console.log(`RoomBridge running at http://${host}:${port}`));
