import bcrypt from "bcryptjs";
import { q } from "@/lib/db";
import { route, body, HttpError, log } from "@/lib/api";

// One customer = one login. Actions: create | reset | disable | enable
export const POST = route(["admin"], async (req, { s, params }) => {
  const b = await body(req); const cid = Number(params.id);
  const c = (await q("SELECT id,mobile FROM customers WHERE id=$1", [cid]))[0]; if (!c) throw new HttpError(404, "Customer not found");
  const u = (await q("SELECT id FROM users WHERE customer_id=$1", [cid]))[0];
  const pw = String(b.password || "");
  if (b.action === "create") {
    if (u) throw new HttpError(409, "This customer already has a login");
    if (pw.length < 8) throw new HttpError(400, "Temporary password must be 8+ characters");
    await q("INSERT INTO users(username,password_hash,role,customer_id,must_change) VALUES($1,$2,'CUSTOMER',$3,true)", [String(b.username || c.mobile).trim().toLowerCase(), await bcrypt.hash(pw, 11), cid]);
  } else {
    if (!u) throw new HttpError(404, "No login exists for this customer");
    if (b.action === "reset") {
      if (pw.length < 8) throw new HttpError(400, "Temporary password must be 8+ characters");
      await q("UPDATE users SET password_hash=$1, must_change=true WHERE id=$2", [await bcrypt.hash(pw, 11), u.id]);
    } else if (b.action === "disable" || b.action === "enable") await q("UPDATE users SET active=$1 WHERE id=$2", [b.action === "enable", u.id]);
    else throw new HttpError(400, "Unknown action");
  }
  await log(s.uid, "CUSTOMER_LOGIN_" + String(b.action).toUpperCase(), String(cid));
  return { ok: true };
});
