import { createHash, randomBytes } from "node:crypto";

export function normalizeCode(code: string) { return code.toUpperCase().replace(/[^A-Z0-9]/g, ""); }
export function hashCode(code: string) { return createHash("sha256").update(normalizeCode(code)).digest("hex"); }
export function generateCode() {
  let raw = "";
  while (raw.length < 12) raw += randomBytes(9).toString("base64url").toUpperCase().replace(/[^A-Z0-9]/g, "");
  raw = raw.slice(0, 12);
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}
