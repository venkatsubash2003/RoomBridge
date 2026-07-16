import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const databasePath = process.env.DATABASE_PATH || resolve(root, "data/roombridge.sqlite");
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath);
db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
  name TEXT NOT NULL, phone TEXT, email_verified INTEGER DEFAULT 0,
  phone_verified INTEGER DEFAULT 0, institution_verified INTEGER DEFAULT 0,
  reputation INTEGER DEFAULT 50, locale TEXT DEFAULT 'en-US', currency TEXT DEFAULT 'USD',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS verification_codes (
  id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  destination TEXT NOT NULL, purpose TEXT NOT NULL, code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL, consumed_at TEXT, attempts INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS verification_requests (
  id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL, subject_id TEXT, document_key TEXT,
  status TEXT DEFAULT 'pending', reviewer_id TEXT REFERENCES users(id),
  decision_reason TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, reviewed_at TEXT
);
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  scenario TEXT, city TEXT, budget INTEGER, room_type TEXT, move_date TEXT,
  lease_duration TEXT, country TEXT, diet TEXT, languages TEXT, bio TEXT,
  lifestyle TEXT DEFAULT '{}', preference_weights TEXT DEFAULT '{}', deal_breakers TEXT DEFAULT '{}',
  public_status TEXT, status_verified INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT, category TEXT NOT NULL, city TEXT NOT NULL,
  neighborhood TEXT, exact_address TEXT, address_visibility TEXT DEFAULT 'mutual_connection',
  rent INTEGER NOT NULL, deposit INTEGER DEFAULT 0, available_date TEXT, lease_duration TEXT,
  furnished TEXT, utilities TEXT, parking TEXT, laundry TEXT, accessibility TEXT,
  amenities TEXT DEFAULT '[]', latitude REAL, longitude REAL, status TEXT DEFAULT 'pending_review',
  verification_status TEXT DEFAULT 'unverified', created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS listing_media (
  id TEXT PRIMARY KEY, listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL, storage_key TEXT NOT NULL, moderation_status TEXT DEFAULT 'pending',
  perceptual_hash TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS saved_searches (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, filters TEXT NOT NULL, alerts_enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL, explanation TEXT NOT NULL, excluded INTEGER DEFAULT 0,
  model_version TEXT DEFAULT 'rules-v1', created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id,candidate_id)
);
CREATE TABLE IF NOT EXISTS match_feedback (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feedback TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,candidate_id)
);
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL, title TEXT, created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE, role TEXT DEFAULT 'member',
  blocked_at TEXT, last_read_at TEXT, PRIMARY KEY(conversation_id,user_id)
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY, conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES users(id), body TEXT, attachment_key TEXT,
  translated_body TEXT, risk_score REAL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS households (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, created_by TEXT REFERENCES users(id),
  status TEXT DEFAULT 'forming', created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS household_members (
  household_id TEXT REFERENCES households(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE, role TEXT DEFAULT 'member',
  room_name TEXT, rent_share INTEGER, PRIMARY KEY(household_id,user_id)
);
CREATE TABLE IF NOT EXISTS household_listings (
  household_id TEXT REFERENCES households(id) ON DELETE CASCADE,
  listing_id TEXT REFERENCES listings(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE, vote TEXT,
  PRIMARY KEY(household_id,listing_id,user_id)
);
CREATE TABLE IF NOT EXISTS lease_workflows (
  id TEXT PRIMARY KEY, listing_id TEXT REFERENCES listings(id), outgoing_user_id TEXT REFERENCES users(id),
  incoming_user_id TEXT REFERENCES users(id), transfer_type TEXT, replacement_date TEXT,
  fee INTEGER DEFAULT 0, landlord_status TEXT DEFAULT 'not_contacted', steps TEXT DEFAULT '{}',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY, reporter_id TEXT REFERENCES users(id), target_type TEXT NOT NULL,
  target_id TEXT NOT NULL, category TEXT NOT NULL, details TEXT, risk TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'new', assigned_to TEXT REFERENCES users(id), created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, title TEXT NOT NULL, body TEXT, read_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_listings_search ON listings(status,city,rent,available_date,category);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id,created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id,read_at,created_at);
`);

export const sql = {
  one(statement, ...params) { return db.prepare(statement).get(...params.map(value=>value===undefined?null:value)); },
  all(statement, ...params) { return db.prepare(statement).all(...params.map(value=>value===undefined?null:value)); },
  run(statement, ...params) { return db.prepare(statement).run(...params.map(value=>value===undefined?null:value)); },
  transaction(fn) { db.exec("BEGIN IMMEDIATE");try{const result=fn();db.exec("COMMIT");return result}catch(error){db.exec("ROLLBACK");throw error} }
};
