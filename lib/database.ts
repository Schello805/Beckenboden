import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { APP_IMPRINT,APP_PRIVACY,LEGAL_CONTENT_MARKER } from "./legal-content";

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
  onboarding_completed_at TEXT,
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
CREATE TABLE IF NOT EXISTS tree_decorations (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media_files(id),
  title TEXT NOT NULL,
  memory_text TEXT NOT NULL DEFAULT '',
  position_x REAL NOT NULL DEFAULT 50 CHECK(position_x BETWEEN 0 AND 100),
  position_y REAL NOT NULL DEFAULT 35 CHECK(position_y BETWEEN 0 AND 100),
  size_percent REAL NOT NULL DEFAULT 12 CHECK(size_percent BETWEEN 3 AND 50),
  rotation REAL NOT NULL DEFAULT 0 CHECK(rotation BETWEEN -180 AND 180),
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tree_decoration_unlocks (
  id TEXT PRIMARY KEY,
  decoration_id TEXT NOT NULL REFERENCES tree_decorations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE(decoration_id,user_id)
);
CREATE TABLE IF NOT EXISTS public_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  location TEXT,
  navigation_url TEXT,
  shop_url TEXT,
  media_id TEXT REFERENCES media_files(id),
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS legal_documents (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  version INTEGER NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  effective_at TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE(slug,version)
);
CREATE TABLE IF NOT EXISTS consent_history (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  consent_type TEXT NOT NULL,
  document_version INTEGER,
  granted INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS attendance_archive (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  participant_reference TEXT NOT NULL,
  source TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  archived_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS account_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK(purpose IN ('password_reset','email_verify','admin_recovery')),
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS request_limits (
  bucket_key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  window_started_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS attendance_qr_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS session_checkins (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_by TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  closed_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS session_reminders (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('day','soon')),
  sent_at TEXT NOT NULL,
  PRIMARY KEY(user_id,session_id,kind)
);
CREATE TABLE IF NOT EXISTS push_messages (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
  audience TEXT NOT NULL CHECK(audience IN ('all','course')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_url TEXT,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS user_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_url TEXT NOT NULL DEFAULT '/',
  read_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS passkey_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT NOT NULL DEFAULT '[]',
  device_type TEXT NOT NULL,
  backed_up INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  last_used_at TEXT
);
CREATE TABLE IF NOT EXISTS passkey_challenges (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK(purpose IN ('registration','authentication')),
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_account_tokens_user ON account_tokens(user_id,purpose);
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
CREATE TABLE IF NOT EXISTS mail_batches (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
  course_title TEXT NOT NULL,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  summary_queued_at TEXT
);
CREATE TABLE IF NOT EXISTS mail_queue (
  id TEXT PRIMARY KEY,
  batch_id TEXT REFERENCES mail_batches(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  recipient TEXT NOT NULL COLLATE NOCASE,
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  code_hint TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','processing','sent','failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  available_at TEXT NOT NULL,
  last_error TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sent_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_codes_course ON access_codes(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_course ON course_sessions(course_id, sequence);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_session_checkins_session ON session_checkins(session_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_course ON content_items(course_id, status);
CREATE INDEX IF NOT EXISTS idx_tree_decorations_course ON tree_decorations(course_id,status);
CREATE INDEX IF NOT EXISTS idx_tree_decoration_unlocks_user ON tree_decoration_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_unlock_user ON manual_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mail_queue_due ON mail_queue(status,available_at);
CREATE INDEX IF NOT EXISTS idx_mail_queue_batch ON mail_queue(batch_id,created_at);
CREATE INDEX IF NOT EXISTS idx_push_messages_created ON push_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id,created_at DESC);
CREATE TRIGGER IF NOT EXISTS audit_log_no_update BEFORE UPDATE ON audit_log BEGIN SELECT RAISE(ABORT,'audit_log is append-only'); END;
CREATE TRIGGER IF NOT EXISTS audit_log_no_delete BEFORE DELETE ON audit_log BEGIN SELECT RAISE(ABORT,'audit_log is append-only'); END;
`);

const onboardingColumn=db.prepare("SELECT 1 FROM pragma_table_info('users') WHERE name='onboarding_completed_at'").get();
if(!onboardingColumn){
  db.exec("ALTER TABLE users ADD COLUMN onboarding_completed_at TEXT");
  db.prepare("UPDATE users SET onboarding_completed_at=?").run(new Date().toISOString());
}

// Additive migrations keep existing LXC installations upgradeable without a destructive reset.
for(const statement of [
  "ALTER TABLE users ADD COLUMN two_factor_method TEXT",
  "ALTER TABLE users ADD COLUMN two_factor_secret TEXT",
  "ALTER TABLE users ADD COLUMN two_factor_pending_secret TEXT",
  "ALTER TABLE users ADD COLUMN recovery_codes TEXT",
  "ALTER TABLE users ADD COLUMN two_factor_enabled_at TEXT",
  "ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN profile_media_id TEXT REFERENCES media_files(id)",
  "ALTER TABLE public_events ADD COLUMN media_id TEXT REFERENCES media_files(id)"
]){try{db.exec(statement)}catch(error){if(!(error instanceof Error)||!error.message.includes("duplicate column name"))throw error}}

const legalCount=(db.prepare("SELECT COUNT(*) count FROM legal_documents").get() as {count:number}).count;
if(!legalCount){const timestamp=new Date().toISOString(),insert=db.prepare("INSERT INTO legal_documents (id,slug,title,version,body,status,effective_at,created_at) VALUES (?,?,?,?,?,'published',?,?)");insert.run(crypto.randomUUID(),"impressum","Impressum",1,APP_IMPRINT,timestamp,timestamp);insert.run(crypto.randomUUID(),"datenschutz","Datenschutzerklärung",1,APP_PRIVACY,timestamp,timestamp);insert.run(crypto.randomUUID(),"nutzungsbedingungen","Nutzungsbedingungen",1,"Die App begleitet gebuchte Präsenzkurse und ersetzt keine medizinische Diagnose oder Behandlung. Zugangscodes sind persönlich zu behandeln. Freigeschaltete Kursinhalte stehen grundsätzlich dauerhaft zur Nutzung bereit; die Betreiberin hält die zugehörigen App-Daten mindestens 24 Monate vor. Gesetzlich erforderliche Anwesenheitsnachweise können länger aufbewahrt werden.\n\nUrheberrechtlich geschützte Inhalte dürfen nur innerhalb der App genutzt werden. Eine Weitergabe von Zugangsdaten oder Kursmaterialien ist unzulässig. Verfügbarkeit, Haftungsbegrenzungen, Widerruf und Beendigung sind vor Veröffentlichung juristisch zu prüfen.\n\nHinweis: Diese Vorlage ersetzt keine Rechtsberatung.",timestamp,timestamp)}
const appLegalInstalled=db.prepare("SELECT 1 FROM legal_documents WHERE slug='datenschutz' AND instr(body,?)>0").get(LEGAL_CONTENT_MARKER);
if(!appLegalInstalled){const timestamp=new Date().toISOString(),insert=db.prepare("INSERT INTO legal_documents (id,slug,title,version,body,status,effective_at,created_at) VALUES (?,?,?,(SELECT COALESCE(MAX(version),0)+1 FROM legal_documents WHERE slug=?),?,'published',?,?)");insert.run(crypto.randomUUID(),"impressum","Impressum","impressum",APP_IMPRINT,timestamp,timestamp);insert.run(crypto.randomUUID(),"datenschutz","Datenschutzerklärung","datenschutz",APP_PRIVACY,timestamp,timestamp)}
const checkinPrivacyInstalled=db.prepare("SELECT 1 FROM legal_documents WHERE slug='datenschutz' AND instr(body,'kurzzeitig gültigen Termin-QR')>0").get();
if(!checkinPrivacyInstalled){const timestamp=new Date().toISOString();db.prepare("INSERT INTO legal_documents (id,slug,title,version,body,status,effective_at,created_at) VALUES (?,?,?,(SELECT COALESCE(MAX(version),0)+1 FROM legal_documents WHERE slug=?),?,'published',?,?)").run(crypto.randomUUID(),"datenschutz","Datenschutzerklärung","datenschutz",APP_PRIVACY,timestamp,timestamp)}

export function now() { return new Date().toISOString(); }
export function id() { return crypto.randomUUID(); }
export function audit(actorId: string | null, action: string, entityType: string, entityId?: string, detail: Record<string, unknown> = {}) {
  db.prepare("INSERT INTO audit_log (id,actor_id,action,entity_type,entity_id,detail,created_at) VALUES (?,?,?,?,?,?,?)")
    .run(id(), actorId, action, entityType, entityId ?? null, JSON.stringify(detail), now());
}
