import crypto from "node:crypto";
import { db,id,now } from "./database";

const hash=(token:string)=>crypto.createHash("sha256").update(token).digest("hex");
export function issueQrToken(userId:string){const token=crypto.randomBytes(24).toString("base64url"),timestamp=now(),expiresAt=new Date(Date.now()+12*60*60_000).toISOString();db.prepare("DELETE FROM attendance_qr_tokens WHERE user_id=? OR expires_at<=?").run(userId,timestamp);db.prepare("INSERT INTO attendance_qr_tokens (id,user_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)").run(id(),userId,hash(token),expiresAt,timestamp);return token}
export function verifyQrTokenValue(token:string){const row=db.prepare("SELECT user_id userId FROM attendance_qr_tokens WHERE token_hash=? AND expires_at>?").get(hash(token),now()) as {userId:string}|undefined;return row?.userId||null}
