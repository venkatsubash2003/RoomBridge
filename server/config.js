const production = process.env.NODE_ENV === "production";

function required(name) {
  const value = process.env[name];
  if (production && !value) throw new Error(`${name} is required in production`);
  return value;
}

export const config = Object.freeze({
  production,
  host: process.env.HOST || "127.0.0.1",
  port: Number(process.env.PORT || 8080),
  publicOrigin: production ? required("PUBLIC_ORIGIN") : process.env.PUBLIC_ORIGIN || "http://localhost:8080",
  databasePath: process.env.DATABASE_PATH,
  trustProxy: process.env.TRUST_PROXY === "true",
  sessionDays: Math.max(1, Number(process.env.SESSION_DAYS || 7)),
  bodyLimit: Math.max(1024, Number(process.env.REQUEST_BODY_LIMIT || 1_000_000)),
  logLevel: process.env.LOG_LEVEL || "info",
  objectStorage: Object.freeze({
    bucket: process.env.OBJECT_STORAGE_BUCKET || "",
    region: process.env.OBJECT_STORAGE_REGION || "us-east-1",
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT || "",
    forcePathStyle: process.env.OBJECT_STORAGE_FORCE_PATH_STYLE === "true"
  })
});

export function assertProductionConfiguration() {
  if (!config.production) return;
  const origin = new URL(config.publicOrigin);
  if (origin.protocol !== "https:") throw new Error("PUBLIC_ORIGIN must use HTTPS in production");
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required in production; local SQLite is development-only");
  }
  for (const name of ["REDIS_URL","OBJECT_STORAGE_BUCKET","OBJECT_STORAGE_ACCESS_KEY","OBJECT_STORAGE_SECRET_KEY","EMAIL_PROVIDER_URL","EMAIL_PROVIDER_KEY","SMS_PROVIDER_URL","SMS_PROVIDER_KEY","MALWARE_SCAN_URL","MALWARE_SCAN_TOKEN","MAPS_PROVIDER_URL","MAPS_API_KEY","OPENAI_API_KEY","OPENAI_MODEL","JOB_ENCRYPTION_KEY","METRICS_TOKEN"]) required(name);
}
