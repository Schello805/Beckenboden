import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });

const dbPath = path.join(dataDir, "kraftbaum.sqlite");
const globalDb = globalThis as unknown as { kraftbaumDb?: Database.Database };

export const db = globalDb.kraftbaumDb ?? new Database(dbPath);
if (process.env.NODE_ENV !== "production") globalDb.kraftbaumDb = db;

db.pragma("busy_timeout = 5000");
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user','admin')) DEFAULT 'user',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birthday TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  email_verified_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  session_count INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  starts_at TEXT,
  ends_at TEXT,
  location TEXT,
  navigation_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  tree_variant TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS access_codes (
  id TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE,
  code_hint TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES courses(id),
  type TEXT NOT NULL CHECK(type IN ('attendance','full','event')),
  assigned_email TEXT COLLATE NOCASE,
  redeemed_by TEXT REFERENCES users(id),
  redeemed_at TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  course_id TEXT NOT NULL REFERENCES courses(id),
  access_mode TEXT NOT NULL,
  tree_variant TEXT NOT NULL,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, course_id)
);
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  detail TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_codes_course ON access_codes(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
`);

export function now() { return new Date().toISOString(); }
export function id() { return crypto.randomUUID(); }
export function audit(actorId: string | null, action: string, entityType: string, entityId?: string, detail: Record<string, unknown> = {}) {
  db.prepare("INSERT INTO audit_log (id,actor_id,action,entity_type,entity_id,detail,created_at) VALUES (?,?,?,?,?,?,?)")
    .run(id(), actorId, action, entityType, entityId ?? null, JSON.stringify(detail), now());
}
