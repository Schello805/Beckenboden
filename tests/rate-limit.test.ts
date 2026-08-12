import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("blocks repeated failed logins without storing an email",async()=>{process.env.DATA_DIR=mkdtempSync(join(tmpdir(),"kraftbaum-rate-"));const {db}=await import("../lib/database");const {failedLogin,loginAllowed,successfulLogin}=await import("../lib/rate-limit");for(let i=0;i<8;i++)failedLogin("anna@example.de");assert.equal(loginAllowed("anna@example.de"),false);const row=db.prepare("SELECT key_hash keyHash FROM login_attempts").get() as {keyHash:string};assert.notEqual(row.keyHash,"anna@example.de");successfulLogin("anna@example.de");assert.equal(loginAllowed("anna@example.de"),true);db.close()});
