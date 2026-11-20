import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { q } from "./db";

export const COOKIE = "mcp_session";
export type Session = { uid: number; username: string; role: "admin" | "customer"; customerId: number | null; mustChange: boolean };
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET || "");

export async function createSession(uid: number, mustChange: boolean) {
  const token = await new SignJWT({ uid, mc: mustChange }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(key());
  cookies().set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 86400 });
}
export function destroySession() { cookies().set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 }); }

// Verifies the signed cookie AND re-checks the user row, so disabling a login takes effect immediately.
export async function getSession(): Promise<Session | null> {
  const t = cookies().get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, key());
    const u = (await q("SELECT id,username,role,customer_id,must_change,active FROM users WHERE id=$1", [payload.uid]))[0];
    if (!u || !u.active) return null;
    return { uid: u.id, username: u.username, role: u.role === "ADMIN" ? "admin" : "customer", customerId: u.customer_id, mustChange: u.must_change };
  } catch { return null; }
}
