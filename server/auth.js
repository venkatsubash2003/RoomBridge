import { randomBytes, randomUUID, randomInt, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { sql } from "./database.js";
import { config } from "./config.js";
import { enqueue } from "./jobs.js";

const hash = value => createHash("sha256").update(value).digest("hex");
export function passwordHash(password, salt=randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function passwordValid(password, stored) {
  const [salt, expected] = stored.split(":");
  const actual = scryptSync(password, salt, 64);
  return expected?.length === 128 && timingSafeEqual(actual, Buffer.from(expected, "hex"));
}
export async function createSession(userId) {
  const token=randomBytes(32).toString("base64url"), expires=new Date(Date.now()+config.sessionDays*864e5).toISOString();
  await sql.run("DELETE FROM sessions WHERE expires_at<=CURRENT_TIMESTAMP");
  await sql.run("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)",hash(token),userId,expires);
  return {token,expires};
}
export async function sessionUser(req) {
  const cookie=req.headers.cookie?.split(";").map(x=>x.trim()).find(x=>x.startsWith("rb_session="));
  if(!cookie)return null;const token=decodeURIComponent(cookie.slice(11));
  return sql.one(`SELECT u.id,u.email,u.name,u.phone,u.email_verified,u.phone_verified,u.institution_verified,u.reputation,u.locale,u.currency
    FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>CURRENT_TIMESTAMP
    AND NOT EXISTS(SELECT 1 FROM user_enforcements ue WHERE ue.user_id=u.id AND ue.action IN ('suspension','ban') AND ue.revoked_at IS NULL AND (ue.expires_at IS NULL OR ue.expires_at>CURRENT_TIMESTAMP))`,hash(token));
}
export async function clearSession(req) { const cookie=req.headers.cookie?.split(";").map(x=>x.trim()).find(x=>x.startsWith("rb_session="));if(cookie)await sql.run("DELETE FROM sessions WHERE token_hash=?",hash(decodeURIComponent(cookie.slice(11)))); }
export async function issueCode(userId,destination,purpose) {
  const code=String(randomInt(100000, 1000000)),id=randomUUID(),expires=new Date(Date.now()+10*60e3).toISOString();
  await sql.run("INSERT INTO verification_codes(id,user_id,destination,purpose,code_hash,expires_at) VALUES(?,?,?,?,?,?)",id,userId,destination,purpose,hash(code),expires);
  if(config.production)await enqueue(purpose==="phone"?"send_sms":"send_email",{destination,purpose,code,expires});
  return {id,code,expires};
}
export async function consumeCode(id,code) {
  const row=await sql.one("SELECT * FROM verification_codes WHERE id=? AND consumed_at IS NULL AND expires_at>CURRENT_TIMESTAMP",id);if(!row||row.attempts>=5)return null;
  await sql.run("UPDATE verification_codes SET attempts=attempts+1 WHERE id=?",id);if(hash(code)!==row.code_hash)return null;
  await sql.run("UPDATE verification_codes SET consumed_at=CURRENT_TIMESTAMP WHERE id=?",id);return row;
}
export { randomUUID };
