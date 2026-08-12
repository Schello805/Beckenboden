import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const isBuild = process.env.npm_lifecycle_event === "build" || process.env.NEXT_PHASE === "phase-production-build";
const dataDir = isBuild
  ? path.join(os.tmpdir(), `mein-kraftbaum-build-${process.pid}`)
  : process.env.DATA_DIR || path.join(process.cwd(), "data");
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
CREATE TABLE IF NOT EXISTS course_sessions (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  location TEXT,
  navigation_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(course_id, sequence)
);
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  session_id TEXT NOT NULL REFERENCES course_sessions(id),
  recorded_by TEXT NOT NULL REFERENCES users(id),
  source TEXT NOT NULL CHECK(source IN ('list','scan','paper','makeup')),
  note TEXT,
  recorded_at TEXT NOT NULL,
  UNIQUE(user_id, session_id)
);
CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('text','image','pdf','video','youtube','vimeo','link')),
  body TEXT,
  asset_path TEXT,
  external_url TEXT,
  status TEXT NOT NULL CHECK(status IN ('draft','published','archived')) DEFAULT 'draft',
  content_updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS media_files (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS unlock_rules (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK(rule_type IN ('immediate','attendance_count','session','manual','completion')),
  threshold INTEGER,
  session_sequence INTEGER,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS manual_unlocks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  content_id TEXT NOT NULL REFERENCES content_items(id),
  granted_by TEXT NOT NULL REFERENCES users(id),
  reason TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, content_id)
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
CREATE TABLE IF NOT EXISTS login_attempts (
  key_hash TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  window_started_at TEXT NOT NULL,
  blocked_until TEXT
);
CREATE INDEX IF NOT EXISTS idx_codes_course ON access_codes(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_course ON course_sessions(course_id, sequence);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_content_course ON content_items(course_id, status);
CREATE INDEX IF NOT EXISTS idx_manual_unlock_user ON manual_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
`);

export function now() { return new Date().toISOString(); }
export function id() { return crypto.randomUUID(); }
export function audit(actorId: string | null, action: string, entityType: string, entityId?: string, detail: Record<string, unknown> = {}) {
  db.prepare("INSERT INTO audit_log (id,actor_id,action,entity_type,entity_id,detail,created_at) VALUES (?,?,?,?,?,?,?)")
    .run(id(), actorId, action, entityType, entityId ?? null, JSON.stringify(detail), now());
}
