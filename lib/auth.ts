import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./database";

const COOKIE = "kraftbaum_session";
const encoder = new TextEncoder();

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET muss mindestens 32 Zeichen lang sein.");
  return encoder.encode(value);
}

export type SessionUser = { id: string; email: string; role: "user" | "admin"; firstName: string; lastName: string; twoFactorEnabled?:boolean };

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function clearSession() { (await cookies()).delete(COOKIE); }

export async function createQrToken(userId:string){return new SignJWT({purpose:"attendance",userId}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("5m").sign(secret());}
export async function verifyQrToken(token:string){try{const {payload}=await jwtVerify(token,secret());if(payload.purpose!=="attendance"||typeof payload.userId!=="string")return null;return payload.userId;}catch{return null;}}

export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const row = db.prepare("SELECT id,email,role,first_name firstName,last_name lastName,(two_factor_enabled_at IS NOT NULL) twoFactorEnabled FROM users WHERE id=? AND status='active'").get(payload.id) as SessionUser | undefined;
    return row ?? null;
  } catch { return null; }
}

export async function requireAdmin(options:{allowTwoFactorSetup?:boolean}={}) {
  const user = await currentUser();
  if (!user || user.role !== "admin") return null;
  if(!options.allowTwoFactorSetup){const secured=db.prepare("SELECT two_factor_enabled_at enabledAt FROM users WHERE id=?").get(user.id) as {enabledAt:string|null}|undefined;if(!secured?.enabledAt)return null}
  return user;
}
