import { sql, databaseReady } from "../server/database.js";

const [email,role]=process.argv.slice(2);
if(!email||!["moderator","admin"].includes(role)){
  console.error("Usage: node scripts/grant-role.mjs user@example.com moderator|admin");
  process.exit(2);
}
if(process.env.NODE_ENV==="production"&&process.env.CONFIRM_ROLE_GRANT!=="yes"){
  console.error("Production role grants require CONFIRM_ROLE_GRANT=yes and an approved change record.");
  process.exit(2);
}
await databaseReady;
const user=await sql.one("SELECT id,email FROM users WHERE email=?",email.trim().toLowerCase());
if(!user){console.error("User not found");process.exit(1)}
await sql.run("INSERT INTO user_roles(user_id,role) VALUES(?,?) ON CONFLICT DO NOTHING",user.id,role);
console.log(JSON.stringify({ok:true,userId:user.id,email:user.email,role}));
