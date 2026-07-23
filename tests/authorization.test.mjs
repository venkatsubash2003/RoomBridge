import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { sql } from "../server/database.js";
import { hasRole, requireAnyRole } from "../server/authorization.js";

test("administrative access requires an explicitly persisted role", async () => {
  const id=randomUUID(),res={writeHead(status){this.status=status},end(value){this.body=value}};
  await sql.run("INSERT INTO users(id,email,password_hash,name) VALUES(?,?,?,?)",id,`${id}@example.com`,"not-a-login-hash","Role Test");
  try{
    assert.equal(await hasRole(id,"moderator"),false);
    assert.equal(await requireAnyRole({id},res,["moderator","admin"]),false);
    assert.equal(res.status,403);
    await sql.run("INSERT INTO user_roles(user_id,role) VALUES(?,?)",id,"moderator");
    assert.equal(await hasRole(id,"moderator"),true);
  }finally{await sql.run("DELETE FROM users WHERE id=?",id)}
});
