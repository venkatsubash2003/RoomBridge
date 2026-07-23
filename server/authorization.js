import { sql } from "./database.js";

export async function hasRole(userId, role) {
  return !!await sql.one("SELECT 1 FROM user_roles WHERE user_id=? AND role=?", userId, role);
}

export async function requireRole(user, res, role) {
  if (await hasRole(user.id, role)) return true;
  res.writeHead(403, { "Content-Type":"application/json; charset=utf-8" });
  res.end(JSON.stringify({ error:"Forbidden", code:"insufficient_role" }));
  return false;
}

export async function requireAnyRole(user, res, roles) {
  const placeholders = roles.map(() => "?").join(",");
  const match = await sql.one(`SELECT 1 FROM user_roles WHERE user_id=? AND role IN (${placeholders}) LIMIT 1`, user.id, ...roles);
  if (match) return true;
  res.writeHead(403, { "Content-Type":"application/json; charset=utf-8" });
  res.end(JSON.stringify({ error:"Forbidden", code:"insufficient_role" }));
  return false;
}

export async function canManageHousehold(userId, householdId) {
  return !!await sql.one(
    "SELECT 1 FROM household_members WHERE household_id=? AND user_id=? AND role='owner'",
    householdId, userId
  );
}

export async function canManageListing(userId, listingId) {
  return !!await sql.one("SELECT 1 FROM listings WHERE id=? AND owner_id=?", listingId, userId);
}

export async function isConversationMember(userId, conversationId) {
  return await sql.one(
    "SELECT blocked_at,role FROM conversation_members WHERE conversation_id=? AND user_id=?",
    conversationId, userId
  );
}
