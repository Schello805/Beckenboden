import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

process.env.DATA_DIR = mkdtempSync(join(tmpdir(), "kraftbaum-db-test-"));
const { audit, db, now } = await import("../lib/database");

test("creates all additive security and retention structures on a fresh database", () => {
  const userColumns = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  const names = new Set(userColumns.map(column => column.name));
  for (const expected of ["two_factor_method", "two_factor_secret", "two_factor_pending_secret", "recovery_codes", "two_factor_enabled_at", "session_version"]) {
    assert.equal(names.has(expected), true, `missing migrated column ${expected}`);
  }
  for (const table of ["attendance_archive", "account_tokens", "consent_history", "login_attempts", "push_subscriptions", "push_messages", "passkey_credentials", "passkey_challenges"]) {
    assert.equal((db.prepare("SELECT COUNT(*) count FROM sqlite_master WHERE type='table' AND name=?").get(table) as { count: number }).count, 1);
  }
  assert.equal((db.prepare("PRAGMA foreign_keys").get() as { foreign_keys: number }).foreign_keys, 1);
});

test("consumes passkey challenges once and keeps purpose boundaries", async () => {
  const {saveChallenge,takeChallenge}=await import("../lib/passkeys");
  const userId=crypto.randomUUID(),stamp=now();
  db.prepare("INSERT INTO users (id,email,password_hash,role,first_name,last_name,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)").run(userId,`${userId}@example.test`,"x","admin","Passkey","Test",stamp,stamp);
  saveChallenge(userId,"challenge-registration","registration");
  assert.equal(takeChallenge(userId,"authentication"),null);
  saveChallenge(userId,"challenge-authentication","authentication");
  assert.equal(takeChallenge(userId,"authentication"),"challenge-authentication");
  assert.equal(takeChallenge(userId,"authentication"),null);
});

test("keeps audit entries append-only", () => {
  audit(null, "test.created", "test", "fixture", { safe: true });
  const row = db.prepare("SELECT id,detail FROM audit_log WHERE action='test.created'").get() as { id: string; detail: string };
  assert.deepEqual(JSON.parse(row.detail), { safe: true });
  assert.throws(() => db.prepare("UPDATE audit_log SET detail='{}' WHERE id=?").run(row.id), /append-only/);
  assert.throws(() => db.prepare("DELETE FROM audit_log WHERE id=?").run(row.id), /append-only/);
});

test("enforces one attendance per participant and course session", () => {
  const stamp = now();
  db.prepare("INSERT INTO users (id,email,password_hash,role,first_name,last_name,created_at,updated_at) VALUES ('admin','admin@example.test','x','admin','A','A',?,?),('user','user@example.test','x','user','U','U',?,?)").run(stamp,stamp,stamp,stamp);
  db.prepare("INSERT INTO courses (id,title,session_count,duration_minutes,status,tree_variant,created_at,updated_at) VALUES ('course','Test',1,90,'published','oak',?,?)").run(stamp,stamp);
  db.prepare("INSERT INTO course_sessions (id,course_id,sequence,title,starts_at,ends_at,created_at,updated_at) VALUES ('session','course',1,'Termin',?,?,?,?)").run(stamp,stamp,stamp,stamp);
  db.prepare("INSERT INTO attendance (id,user_id,session_id,recorded_by,source,recorded_at) VALUES ('one','user','session','admin','list',?)").run(stamp);
  assert.throws(() => db.prepare("INSERT INTO attendance (id,user_id,session_id,recorded_by,source,recorded_at) VALUES ('two','user','session','admin','paper',?)").run(stamp), /UNIQUE/);
});
