import assert from "node:assert/strict";
import test from "node:test";
import { generateCode, hashCode, normalizeCode } from "../lib/codes.ts";

test("generates human-readable unique one-time codes", () => {
  const codes = new Set(Array.from({ length: 250 }, generateCode));
  assert.equal(codes.size, 250);
  for (const code of codes) assert.match(code, /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
});

test("normalizes formatting before hashing", () => {
  assert.equal(normalizeCode("abcd-1234 efgh"), "ABCD1234EFGH");
  assert.equal(hashCode("ABCD-1234-EFGH"), hashCode("abcd1234efgh"));
  assert.equal(hashCode("ABCD-1234-EFGH").length, 64);
});
