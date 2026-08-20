import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const root=new URL("../",import.meta.url);
const read=path=>readFile(new URL(path,root),"utf8");

test("keeps complete CRUD contracts for mutable admin records",async()=>{
  const routes={
    course:[await read("app/api/admin/courses/route.ts"),await read("app/api/admin/courses/[courseId]/route.ts")],
    session:[await read("app/api/admin/courses/[courseId]/sessions/route.ts"),await read("app/api/admin/courses/[courseId]/sessions/[sessionId]/route.ts")],
    event:[await read("app/api/admin/events/route.ts"),await read("app/api/admin/events/[eventId]/route.ts")],
    content:[await read("app/api/admin/content/route.ts"),await read("app/api/admin/content/[contentId]/route.ts")],
    decoration:[await read("app/api/admin/tree-decorations/route.ts"),await read("app/api/admin/tree-decorations/[decorationId]/route.ts")]
  };
  for(const [name,files] of Object.entries(routes)){
    const source=files.join("\n");
    assert.match(source,/export async function (GET)/,`${name} needs read`);
    assert.match(source,/export async function (POST)/,`${name} needs create`);
    assert.match(source,/export async function (PATCH)/,`${name} needs update`);
    assert.match(source,/export async function (DELETE)/,`${name} needs delete`);
  }
});

test("documents protected non-CRUD records instead of silently deleting evidence",async()=>{
  const [database,matrix]=await Promise.all([read("lib/database.ts"),read("docs/CRUD-MATRIX.md")]);
  assert.match(database,/audit_log_no_update/);
  assert.match(database,/audit_log_no_delete/);
  assert.match(matrix,/Auditprotokoll[\s\S]*append-only/);
  assert.match(matrix,/Anwesenheit[\s\S]*nicht spurlos gelöscht/);
});
