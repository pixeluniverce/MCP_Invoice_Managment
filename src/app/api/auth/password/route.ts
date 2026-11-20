import bcrypt from "bcryptjs";
import { q } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { route, body, HttpError, log } from "@/lib/api";

export const POST = route(["admin", "customer"], async (req, { s }) => {
  const b = await body(req);
  const u = (await q("SELECT password_hash FROM users WHERE id=$1", [s.uid]))[0];
  if (!(await bcrypt.compare(String(b.current || ""), u.password_hash))) throw new HttpError(400, "Current password is incorrect");
  const pw = String(b.password || "");
  if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) throw new HttpError(400, "New password needs 8+ characters with letters and numbers");
  if (pw === b.current) throw new HttpError(400, "New password must be different");
  await q("UPDATE users SET password_hash=$1, must_change=false WHERE id=$2", [await bcrypt.hash(pw, 11), s.uid]);
  await createSession(s.uid, false); await log(s.uid, "PASSWORD_CHANGED");
  return { ok: true, role: s.role };
}, { allowMustChange: true });
