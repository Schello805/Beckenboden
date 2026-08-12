import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("completes a course only after every attendance is present", async () => {
  process.env.DATA_DIR = mkdtempSync(join(tmpdir(), "kraftbaum-progress-"));
  const { db, id, now } = await import("../lib/database");
  const { refreshCompletion } = await import("../lib/progress");
  const timestamp=now(), userId=id(), adminId=id(), courseId=id(), firstSession=id(), secondSession=id();
  const insertUser=db.prepare("INSERT INTO users (id,email,password_hash,role,first_name,last_name,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)");
  insertUser.run(userId,"user@example.de","hash","user","Anna","Test","active",timestamp,timestamp);
  insertUser.run(adminId,"admin@example.de","hash","admin","Anja","Test","active",timestamp,timestamp);
  db.prepare("INSERT INTO courses (id,title,description,session_count,duration_minutes,status,tree_variant,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").run(courseId,"Testkurs","",2,90,"published","sage",timestamp,timestamp);
  const insertSession=db.prepare("INSERT INTO course_sessions (id,course_id,sequence,title,starts_at,ends_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)");
  insertSession.run(firstSession,courseId,1,"Eins",timestamp,new Date(Date.now()+1000).toISOString(),timestamp,timestamp);
  insertSession.run(secondSession,courseId,2,"Zwei",timestamp,new Date(Date.now()+1000).toISOString(),timestamp,timestamp);
  db.prepare("INSERT INTO enrollments (id,user_id,course_id,access_mode,tree_variant,created_at) VALUES (?,?,?,?,?,?)").run(id(),userId,courseId,"attendance","sage",timestamp);
  const attend=db.prepare("INSERT INTO attendance (id,user_id,session_id,recorded_by,source,recorded_at) VALUES (?,?,?,?,?,?)");
  attend.run(id(),userId,firstSession,adminId,"list",timestamp);
  refreshCompletion(userId,courseId);
  assert.equal((db.prepare("SELECT completed_at value FROM enrollments WHERE user_id=?").get(userId) as {value:string|null}).value,null);
  attend.run(id(),userId,secondSession,adminId,"makeup",timestamp);
  refreshCompletion(userId,courseId);
  assert.ok((db.prepare("SELECT completed_at value FROM enrollments WHERE user_id=?").get(userId) as {value:string|null}).value);
  db.close();
});
