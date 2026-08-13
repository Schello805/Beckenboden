import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./database";
import { issueQrToken,verifyQrTokenValue } from "./qr-token";

const COOKIE = "kraftbaum_session";
const encoder = new TextEncoder();

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET muss mindestens 32 Zeichen lang sein.");
  return encoder.encode(value);
}

export type SessionUser = { id: string; email: string; role: "user" | "admin"; firstName: string; lastName: string; twoFactorEnabled?:boolean;profileImage?:boolean };

export async function createSession(user: SessionUser) {
  const row=db.prepare("SELECT session_version sessionVersion FROM users WHERE id=?").get(user.id) as {sessionVersion:number}|undefined;
  const token = await new SignJWT({...user,sessionVersion:row?.sessionVersion||0}).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function clearSession() { (await cookies()).delete(COOKIE); }

export async function createQrToken(userId:string){return issueQrToken(userId)}
export async function verifyQrToken(token:string){return verifyQrTokenValue(token)}

export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const row = db.prepare("SELECT id,email,role,first_name firstName,last_name lastName,(two_factor_enabled_at IS NOT NULL) twoFactorEnabled,(profile_media_id IS NOT NULL) profileImage,session_version sessionVersion FROM users WHERE id=? AND status='active'").get(payload.id) as (SessionUser&{sessionVersion:number}) | undefined;
    return row&&row.sessionVersion===Number(payload.sessionVersion||0)?row:null;
  } catch { return null; }
}

export async function requireAdmin(options:{allowTwoFactorSetup?:boolean}={}) {
  const user = await currentUser();
  if (!user || user.role !== "admin") return null;
  if(!options.allowTwoFactorSetup){const secured=db.prepare("SELECT two_factor_enabled_at enabledAt FROM users WHERE id=?").get(user.id) as {enabledAt:string|null}|undefined;if(!secured?.enabledAt)return null}
  return user;
}
