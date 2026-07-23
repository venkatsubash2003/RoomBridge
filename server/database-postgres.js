import pg from "pg";
import { readFile, readdir } from "node:fs/promises";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Math.max(2, Number(process.env.DATABASE_POOL_SIZE || 10)),
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" }
});

const bind = statement => {
  let index = 0;
  return statement.replace(/\?/g, () => `$${++index}`);
};
const values = params => params.map(value => value === undefined ? null : value);
const clientApi = client => ({
  async one(statement, ...params) { return (await client.query(bind(statement), values(params))).rows[0] || null; },
  async all(statement, ...params) { return (await client.query(bind(statement), values(params))).rows; },
  async run(statement, ...params) { return client.query(bind(statement), values(params)); }
});

export const databaseKind = "postgresql";
export const databaseReady = (async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(824667331)");
    await client.query("CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY,applied_at TIMESTAMPTZ DEFAULT NOW())");
    const directory=new URL("../migrations/",import.meta.url),files=(await readdir(directory)).filter(name=>/^\d+_.+\.postgres\.sql$/.test(name)).sort();
    for(const file of files){
      const version=Number(file.split("_")[0]),applied=await client.query("SELECT 1 FROM schema_migrations WHERE version=$1",[version]);
      if(applied.rowCount)continue;
      await client.query(await readFile(new URL(file,directory),"utf8"));
      await client.query("INSERT INTO schema_migrations(version) VALUES($1) ON CONFLICT DO NOTHING",[version]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
})();

export const sql = {
  async one(statement, ...params) { await databaseReady;return clientApi(pool).one(statement, ...params); },
  async all(statement, ...params) { await databaseReady;return clientApi(pool).all(statement, ...params); },
  async run(statement, ...params) { await databaseReady;return clientApi(pool).run(statement, ...params); },
  async transaction(fn) {
    await databaseReady;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await fn(clientApi(client));
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
};
