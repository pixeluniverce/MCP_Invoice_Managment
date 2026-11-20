import { q } from "@/lib/db";
import { route, body, need, num, digits, HttpError, log } from "@/lib/api";
import { customerSummary } from "@/lib/data";

export const GET = route(["admin"], async (_r, { params }) => customerSummary(Number(params.id)));

export const PUT = route(["admin"], async (req, { s, params }) => {
  const b = await body(req); const id = Number(params.id);
  need(String(b.name || "").trim(), "Customer name is required");
  const mobile = digits(b.mobile); if (mobile.length < 10) throw new HttpError(400, "Enter a valid mobile number");
  const r = await q(`UPDATE customers SET name=$1,mobile=$2,alt_mobile=$3,address=$4,city=$5,state=$6,pin=$7,gstin=$8,opening_balance=$9,notes=$10,active=$11,whatsapp_optin=$12 WHERE id=$13 RETURNING id`,
    [b.name.trim(), mobile, digits(b.alt_mobile) || null, b.address || null, b.city || null, b.state || null, b.pin || null, (b.gstin || "").toUpperCase() || null, num(b.opening_balance), b.notes || null, b.active !== false, b.whatsapp_optin !== false, id]);
  if (!r.length) throw new HttpError(404, "Customer not found");
  await log(s.uid, "CUSTOMER_UPDATED", String(id));
  return { ok: true };
});
