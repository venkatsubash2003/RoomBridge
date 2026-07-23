import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir:"./tests/e2e",
  timeout:30_000,
  retries:1,
  use:{baseURL:"http://127.0.0.1:8092",trace:"retain-on-failure"},
  webServer:{
    command:"env PORT=8092 PUBLIC_ORIGIN=http://127.0.0.1:8092 DATABASE_PATH=/tmp/roombridge-e2e.sqlite npm start",
    url:"http://127.0.0.1:8092/api/health",
    reuseExistingServer:false,
    timeout:30_000
  }
});
