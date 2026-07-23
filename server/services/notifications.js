import { randomUUID } from "node:crypto";
import { sql } from "../database.js";
export async function notify(userId,type,title,body="") { const id=randomUUID();await sql.run("INSERT INTO notifications(id,user_id,type,title,body) VALUES(?,?,?,?,?)",id,userId,type,title,body);return id; }
