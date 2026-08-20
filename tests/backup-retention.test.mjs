import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("prunes every backup type to its configured limit",()=>{
  const sandbox=fs.mkdtempSync(path.join(os.tmpdir(),"kraftbaum-backups-")),root=path.join(sandbox,"backups"),data=path.join(sandbox,"data");
  fs.mkdirSync(root);fs.mkdirSync(data);
  fs.writeFileSync(path.join(data,"backup-retention.json"),JSON.stringify({daily:2,update:1,manual:1,"pre-restore":1}));
  for(const kind of ["daily","update","manual","pre-restore"])for(let day=1;day<=4;day++)fs.mkdirSync(path.join(root,`2026080${day}-120000-${kind}`));
  const output=execFileSync(process.execPath,[path.resolve("scripts/prune-backups.mjs")],{env:{...process.env,BACKUP_ROOT:root,DATA_DIR:data},encoding:"utf8"});
  const result=JSON.parse(output);
  assert.equal(result.removed.length,11);
  assert.deepEqual(fs.readdirSync(root).sort(),["20260803-120000-daily","20260804-120000-daily","20260804-120000-manual","20260804-120000-pre-restore","20260804-120000-update"]);
  fs.rmSync(sandbox,{recursive:true,force:true});
});
