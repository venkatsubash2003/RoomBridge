import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const check=environment=>spawnSync(process.execPath,["--input-type=module","--eval","import {assertProductionConfiguration} from './server/config.js'; assertProductionConfiguration()"],{cwd:process.cwd(),env:{PATH:process.env.PATH,...environment},encoding:"utf8"});
const complete={
  NODE_ENV:"production",PUBLIC_ORIGIN:"https://roombridge.example",DATABASE_URL:"postgres://db",
  REDIS_URL:"redis://cache",OBJECT_STORAGE_BUCKET:"private",OBJECT_STORAGE_ACCESS_KEY:"key",
  OBJECT_STORAGE_SECRET_KEY:"secret",EMAIL_PROVIDER_URL:"https://email.example",EMAIL_PROVIDER_KEY:"key",
  SMS_PROVIDER_URL:"https://sms.example",SMS_PROVIDER_KEY:"key",MALWARE_SCAN_URL:"https://scan.example",
  MALWARE_SCAN_TOKEN:"key",MAPS_PROVIDER_URL:"https://maps.example",MAPS_API_KEY:"key",
  OPENAI_API_KEY:"key",OPENAI_MODEL:"gpt-test",JOB_ENCRYPTION_KEY:Buffer.alloc(32,1).toString("base64"),METRICS_TOKEN:"metrics"
};

test("production refuses to start with missing external-service configuration", () => {
  const result=check({NODE_ENV:"production",PUBLIC_ORIGIN:"https://roombridge.example"});
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/DATABASE_URL is required/);
});

test("production configuration gate accepts a complete external-service contract", () => {
  const result=check(complete);
  assert.equal(result.status,0,result.stderr);
});
