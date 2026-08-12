import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError,messageOf,requestJson } from "../app/client-api";

test("turns authorization and setup failures into actionable guidance",async()=>{const original=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({error:"Nicht berechtigt."}),{status:403,headers:{"content-type":"application/json"}});await assert.rejects(()=>requestJson("/test"),/Sicherheit.*Zwei-Faktor/);globalThis.fetch=original});
test("keeps specific safe server feedback",async()=>{const original=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({error:"Gib beim ersten Speichern das SMTP-Passwort ein."}),{status:400,headers:{"content-type":"application/json"}});await assert.rejects(()=>requestJson("/test"),/SMTP-Passwort/);globalThis.fetch=original});
test("explains network failures without exposing internals",async()=>{const original=globalThis.fetch;globalThis.fetch=async()=>{throw new Error("socket secret")};await assert.rejects(()=>requestJson("/test"),/Internetverbindung/);assert.equal(messageOf(new ApiError("Verständlich")),"Verständlich");globalThis.fetch=original});
