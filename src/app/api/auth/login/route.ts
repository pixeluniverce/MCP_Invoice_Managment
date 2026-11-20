import bcrypt from "bcryptjs";
import { q } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { json } from "@/lib/api";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const id = String(b.username || "").trim().toLowerCase(), pw = String(b.password || "");
    if (!id || !pw) return json({ error: "Enter username and password" }, 400);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "";
    const fails = (await q("SELECT COUNT(*)::int n FROM login_attempts WHERE username=$1 AND created_at>now()-interval '15 minutes'", [id]))[0].n;
    if (fails >= 5) return json({ error: "Too many failed attempts. Try again in 15 minutes." }, 429);
    const u = (await q(`SELECT u.*, c.active cust_active FROM users u LEFT JOIN customers c ON c.id=u.customer_id
      WHERE lower(u.username)=$1 OR c.mobile=$1 ORDER BY (lower(u.username)=$1) DESC LIMIT 1`, [id]))[0];
    const ok = u && u.active && (u.role === "ADMIN" || u.cust_active) && (await bcrypt.compare(pw, u.password_hash));
    if (!ok) { await q("INSERT INTO login_attempts(username,ip) VALUES($1,$2)", [id, ip]); return json({ error: "Invalid username or password" }, 401); }
    await q("DELETE FROM login_attempts WHERE username=$1", [id]);
    await q("UPDATE users SET last_login=now() WHERE id=$1", [u.id]);
    await createSession(u.id, u.must_change);
    return json({ role: u.role === "ADMIN" ? "admin" : "customer", mustChange: u.must_change });
  } catch (e) { console.error(e); return json({ error: "Server error" }, 500); }
}
