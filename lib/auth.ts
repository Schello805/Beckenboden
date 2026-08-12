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

export type SessionUser = { id: string; email: string; role: "user" | "admin"; firstName: string; lastName: string };

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function clearSession() { (await cookies()).delete(COOKIE); }

export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const row = db.prepare("SELECT id,email,role,first_name firstName,last_name lastName FROM users WHERE id=? AND status='active'").get(payload.id) as SessionUser | undefined;
    return row ?? null;
  } catch { return null; }
}

export async function requireAdmin() {
  const user = await currentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}
