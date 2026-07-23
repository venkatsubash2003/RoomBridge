import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import { sql } from "./database.js";
import { config } from "./config.js";

function key(){
  if(!process.env.JOB_ENCRYPTION_KEY){if(config.production)throw new Error("JOB_ENCRYPTION_KEY is required");return null}
  const decoded=Buffer.from(process.env.JOB_ENCRYPTION_KEY,"base64");if(decoded.length!==32)throw new Error("JOB_ENCRYPTION_KEY must be a base64-encoded 32-byte key");return decoded;
}
export function encodePayload(payload){
  const secret=key();if(!secret)return JSON.stringify(payload);
  const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",secret,iv),encrypted=Buffer.concat([cipher.update(JSON.stringify(payload)),cipher.final()]);
  return JSON.stringify({v:1,iv:iv.toString("base64"),tag:cipher.getAuthTag().toString("base64"),data:encrypted.toString("base64")});
}
export function decodePayload(value){
  const parsed=typeof value==="string"?JSON.parse(value):value;if(!parsed?.v)return parsed;
  const decipher=createDecipheriv("aes-256-gcm",key(),Buffer.from(parsed.iv,"base64"));decipher.setAuthTag(Buffer.from(parsed.tag,"base64"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(parsed.data,"base64")),decipher.final()]).toString("utf8"));
}
export async function enqueue(kind,payload){
  const id=randomUUID();await sql.run("INSERT INTO jobs(id,kind,payload) VALUES(?,?,?)",id,kind,encodePayload(payload));return id;
}
