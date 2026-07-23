import test from "node:test";
import assert from "node:assert/strict";
import { encodePayload, decodePayload } from "../server/jobs.js";

test("job payload encryption round-trips sensitive delivery data", () => {
  const previous=process.env.JOB_ENCRYPTION_KEY;
  process.env.JOB_ENCRYPTION_KEY=Buffer.alloc(32,7).toString("base64");
  try{
    const payload={destination:"person@example.com",code:"123456"},encoded=encodePayload(payload);
    assert.doesNotMatch(encoded,/123456|person@example/);
    assert.deepEqual(decodePayload(encoded),payload);
  }finally{
    if(previous===undefined)delete process.env.JOB_ENCRYPTION_KEY;else process.env.JOB_ENCRYPTION_KEY=previous;
  }
});
