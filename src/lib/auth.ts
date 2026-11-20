import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must be at least 32 characters.");
  return new TextEncoder().encode(value);
};

export async function createSession(user: { id: string; role: "ADMIN" | "CUSTOMER" }) {
  const token = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" }).setSubject(user.id)
    .setIssuedAt().setExpirationTime("7d").sign(secret());
  (await cookies()).set("mcp_session", token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7
  });
}

export async function getSession() {
  const token = (await cookies()).get("mcp_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active) return null;
    return { id: user.id, role: user.role, customerId: user.customerId, username: user.username };
  } catch { return null; }
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("FORBIDDEN");
  return session;
}
