import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const schema = z.object({ username: z.string().min(1).max(80), password: z.string().min(1).max(200) });
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter username and password." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!user || !user.active || !(await bcrypt.compare(parsed.data.password, user.passwordHash)))
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession({ id: user.id, role: user.role });
  return NextResponse.json({ ok: true });
}