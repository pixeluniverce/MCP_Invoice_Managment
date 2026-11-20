import bcrypt from "bcryptjs";
import { tx } from "@/lib/db";
import { route, body, need, num, digits, qs, HttpError, log } from "@/lib/api";
import { listCustomers } from "@/lib/data";

export const GET = route(["admin"], async (req) => {
  const p = qs(req);
  return listCustomers({ search: p.get("search") || "", page: num(p.get("page"), 1), size: num(p.get("size"), 25), outstanding: p.get("outstanding") === "1", sort: p.get("sort") || "" });
});

export const POST = route(["admin"], async (req, { s }) => {
  const b = await body(req);
  need(String(b.name || "").trim(), "Customer name is required");
  const mobile = digits(b.mobile); if (mobile.length < 10) throw new HttpError(400, "Enter a valid mobile number");
  if (b.create_login && String(b.password || "").length < 8) throw new HttpError(400, "Temporary password must be 8+ characters");
  const id = await tx(async (c) => {
    const r = await c.query(`INSERT INTO customers(name,mobile,alt_mobile,address,city,state,pin,gstin,opening_balance,notes,whatsapp_optin) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [b.name.trim(), mobile, digits(b.alt_mobile) || null, b.address || null, b.city || null, b.state || null, b.pin || null, (b.gstin || "").toUpperCase() || null, num(b.opening_balance), b.notes || null, b.whatsapp_optin !== false]);
    const cid = r.rows[0].id;
    if (b.create_login) await c.query("INSERT INTO users(username,password_hash,role,customer_id,must_change) VALUES($1,$2,'CUSTOMER',$3,true)", [String(b.username || mobile).trim().toLowerCase(), await bcrypt.hash(b.password, 11), cid]);
    return cid;
  });
  await log(s.uid, "CUSTOMER_CREATED", String(id));
  return { id };
});
