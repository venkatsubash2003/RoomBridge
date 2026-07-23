import { randomUUID } from "node:crypto";
import { sql } from "./database.js";
import { clientIp } from "./rate-limit.js";

export async function audit(req, action, { actorId = null, targetType = null, targetId = null, outcome = "success", metadata = {} } = {}) {
  await sql.run(
    "INSERT INTO audit_events(id,actor_id,action,target_type,target_id,outcome,ip,user_agent,metadata) VALUES(?,?,?,?,?,?,?,?,?)",
    randomUUID(), actorId, action, targetType, targetId, outcome, clientIp(req),
    String(req.headers["user-agent"] || "").slice(0, 500), JSON.stringify(metadata)
  );
}
