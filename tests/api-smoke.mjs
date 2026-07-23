import assert from "node:assert/strict";

const base = process.env.API_URL || "http://127.0.0.1:8080/api";
const email = `test-${Date.now()}@example.com`;
const request = async (path, options={}) => {
  const response = await fetch(base+path, {
    ...options,
    headers: { "content-type":"application/json", ...(options.headers||{}) },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json();
  return { response, data };
};

const registration = await request("/auth/register", { method:"POST", body:{name:"API Test",email,password:"RoomBridge123"} });
assert.equal(registration.response.status, 201);
assert.ok(registration.data.demoCode);

const verification = await request("/auth/verify", { method:"POST", body:{verificationId:registration.data.verificationId,code:registration.data.demoCode} });
assert.equal(verification.response.status, 200);
assert.equal(verification.data.user.emailVerified, true);
const cookie = verification.response.headers.get("set-cookie").split(";")[0];

const profile = await request("/profile", { method:"PUT", headers:{cookie}, body:{city:"Jersey City, NJ",budget:1400,roomType:"Private room",languages:["English"],lifestyle:{cleanliness:"Tidy"},weights:{budget:"important"},dealBreakers:{noSmoking:true}} });
assert.equal(profile.response.status, 200);

const secondEmail = `candidate-${Date.now()}@example.com`;
const secondRegistration = await request("/auth/register", { method:"POST", body:{name:"Candidate User",email:secondEmail,password:"CandidateRoomBridge123"} });
const secondVerification = await request("/auth/verify", { method:"POST", body:{verificationId:secondRegistration.data.verificationId,code:secondRegistration.data.demoCode} });
const secondCookie = secondVerification.response.headers.get("set-cookie").split(";")[0];
await request("/profile", { method:"PUT",headers:{cookie:secondCookie},body:{city:"Jersey City, NJ",budget:1350,roomType:"Private room",languages:["English"],lifestyle:{cleanliness:"Tidy",smoking:"No"},weights:{budget:"important"},dealBreakers:{}} });
const matches = await request("/matches", { headers:{cookie} });
assert.ok(matches.data.matches.some(item=>item.user_id===secondVerification.data.user.id));
const savedCandidate = await request(`/saved-profiles/${secondVerification.data.user.id}`, { method:"PUT",headers:{cookie} });
assert.equal(savedCandidate.response.status, 200);
const blockCandidate = await request(`/blocks/${secondVerification.data.user.id}`, { method:"POST",headers:{cookie},body:{} });
assert.equal(blockCandidate.response.status, 200);
const blockedMatches = await request("/matches", { headers:{cookie} });
assert.ok(!blockedMatches.data.matches.some(item=>item.user_id===secondVerification.data.user.id));
const blockedConversation = await request("/conversations", { method:"POST",headers:{cookie},body:{title:"Blocked chat",memberIds:[secondVerification.data.user.id]} });
assert.equal(blockedConversation.response.status, 403);
await request(`/blocks/${secondVerification.data.user.id}`, { method:"DELETE",headers:{cookie} });

const me = await request("/auth/me", { headers:{cookie} });
assert.equal(me.data.user.email, email);

const accountExport = await request("/account/export", { headers:{cookie} });
assert.equal(accountExport.response.status, 200);
assert.equal(accountExport.data.user.email, email);

const adminDenied = await request("/admin/reports", { headers:{cookie} });
assert.equal(adminDenied.response.status, 403);

const listingKey=`listing-${Date.now()}`;
const listing = await request("/listings", { method:"POST", headers:{cookie,"idempotency-key":listingKey}, body:{
  title:"API Test Room",category:"Private room",city:"Jersey City, NJ",rent:1200,availableDate:"2026-09-01"
} });
assert.equal(listing.response.status, 201);
const listingReplay = await request("/listings", { method:"POST", headers:{cookie,"idempotency-key":listingKey}, body:{
  title:"Ignored retry payload",category:"Private room",city:"Jersey City, NJ",rent:9999
} });
assert.equal(listingReplay.data.id,listing.data.id);
assert.equal(listingReplay.response.headers.get("idempotency-replayed"),"true");
const mine = await request("/listings/mine", { headers:{cookie} });
assert.ok(mine.data.listings.some(item=>item.id===listing.data.id));
const lease = await request("/lease-workflows", { method:"POST", headers:{cookie}, body:{
  listingId:listing.data.id,transferType:"Lease assignment",replacementDate:"2026-09-01",fee:100,steps:{details:true}
} });
assert.equal(lease.response.status, 201);

const savedSearch = await request("/saved-searches", { method:"POST", headers:{cookie}, body:{
  name:"Jersey City under 1500",filters:{city:"Jersey City, NJ",maxRent:1500},alertsEnabled:true
} });
assert.equal(savedSearch.response.status, 201);
const pauseSearch = await request(`/saved-searches/${savedSearch.data.id}`, { method:"PATCH",headers:{cookie},body:{alertsEnabled:false} });
assert.equal(pauseSearch.response.status, 200);

const household = await request("/households", { method:"POST",headers:{cookie},body:{name:"API Test Household"} });
assert.equal(household.response.status, 201);
const householdDetail = await request(`/households/${household.data.id}`, { headers:{cookie} });
assert.equal(householdDetail.data.members[0].role, "owner");
const householdDenied = await request(`/households/${household.data.id}`, { headers:{cookie:secondCookie} });
assert.equal(householdDenied.response.status, 403);

const conversation = await request("/conversations", { method:"POST",headers:{cookie},body:{title:"API Test Chat",memberIds:[secondVerification.data.user.id]} });
assert.equal(conversation.response.status, 201);
const messageKey=`message-${Date.now()}`;
const sent = await request(`/conversations/${conversation.data.id}/messages`, { method:"POST",headers:{cookie,"idempotency-key":messageKey},body:{body:"Hello from the API test"} });
assert.equal(sent.response.status, 201);
const sentReplay = await request(`/conversations/${conversation.data.id}/messages`, { method:"POST",headers:{cookie,"idempotency-key":messageKey},body:{body:"This retry must not be inserted"} });
assert.equal(sentReplay.data.id,sent.data.id);
const messagePage = await request(`/conversations/${conversation.data.id}/messages?limit=10`, { headers:{cookie} });
assert.equal(messagePage.data.messages[0].body, "Hello from the API test");

const health = await request("/health");
assert.equal(health.data.ok, true);

const resetRequest = await request("/auth/password-reset/request", { method:"POST", body:{email} });
assert.equal(resetRequest.response.status, 202);
assert.ok(resetRequest.data.verificationId);
const resetConfirm = await request("/auth/password-reset/confirm", { method:"POST", body:{
  verificationId:resetRequest.data.verificationId, code:resetRequest.data.demoCode, password:"UpdatedRoomBridge456"
} });
assert.equal(resetConfirm.response.status, 200);
const oldSession = await request("/auth/me", { headers:{cookie} });
assert.equal(oldSession.response.status, 401);
const newLogin = await request("/auth/login", { method:"POST", body:{email,password:"UpdatedRoomBridge456"} });
assert.equal(newLogin.response.status, 200);

console.log("API smoke test passed: identity, authorization, durable workflows, reset, database, health");
