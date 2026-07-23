import test from "node:test";
import assert from "node:assert/strict";
import { clientIp, rateLimit } from "../server/rate-limit.js";

const response=()=>({headers:{},setHeader(name,value){this.headers[name]=value},writeHead(status){this.status=status},end(value){this.body=value}});

test("untrusted forwarded headers cannot spoof the rate-limit identity", () => {
  const req={headers:{"x-forwarded-for":"203.0.113.10"},socket:{remoteAddress:"127.0.0.9"}};
  assert.equal(clientIp(req),"127.0.0.9");
});

test("development fallback enforces the configured request limit", async () => {
  const req={headers:{},socket:{remoteAddress:"127.0.0.8"}};
  assert.equal(await rateLimit(req,response(),{key:"unit-rate",limit:1,windowMs:60_000}),true);
  const rejected=response();
  assert.equal(await rateLimit(req,rejected,{key:"unit-rate",limit:1,windowMs:60_000}),false);
  assert.equal(rejected.status,429);
});
