const adapter = process.env.DATABASE_URL
  ? await import("./database-postgres.js")
  : await import("./database-sqlite.js");

export const sql = adapter.sql;
export const databaseKind = adapter.databaseKind;
export const databaseReady = adapter.databaseReady;
