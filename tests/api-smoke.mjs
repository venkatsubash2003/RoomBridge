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

const me = await request("/auth/me", { headers:{cookie} });
assert.equal(me.data.user.email, email);

const health = await request("/health");
assert.equal(health.data.ok, true);

console.log("API smoke test passed: registration, verification, session, profile, database, health");
