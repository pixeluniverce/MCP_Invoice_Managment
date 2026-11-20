import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { SCHEMA } from "@/lib/schema";
export const dynamic = "force-dynamic";

// One-time (idempotent) setup: creates tables and the first admin. Visit /api/setup?key=SETUP_KEY
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.SETUP_KEY || key !== process.env.SETUP_KEY) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 16) return NextResponse.json({ error: "Set AUTH_SECRET (16+ chars) in Vercel env vars" }, { status: 500 });
  const c = await pool.connect();
  try {
    await c.query(SCHEMA);
    let adminCreated = false;
    const has = await c.query("SELECT 1 FROM users WHERE role='ADMIN' LIMIT 1");
    if (!has.rowCount) {
      const pw = process.env.ADMIN_PASSWORD || "";
      if (pw.length < 8) return NextResponse.json({ error: "Set ADMIN_PASSWORD (8+ chars) to create the first admin" }, { status: 500 });
      const hash = await bcrypt.hash(pw, 11);
      await c.query("INSERT INTO users(username,password_hash,role) VALUES($1,$2,'ADMIN')", [(process.env.ADMIN_USERNAME || "admin").toLowerCase(), hash]);
      adminCreated = true;
    }
    return NextResponse.json({ ok: true, adminCreated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
  finally { c.release(); }
}
