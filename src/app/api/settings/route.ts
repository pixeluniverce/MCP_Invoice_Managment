import { q } from "@/lib/db";
import { route, body, num, log } from "@/lib/api";
import { publicSettings } from "@/lib/data";

export const GET = route(["admin"], async () => publicSettings());

const TEXT = ["name", "address", "mobile", "email", "gstin", "state", "state_code", "invoice_prefix", "payment_terms", "wa_phone", "wa_phone_id", "wa_waba_id", "wa_api_version", "wa_template_name", "wa_template_lang"];
const SECRET = ["wa_token", "wa_verify_token", "wa_app_secret"]; // only overwritten when a new value is typed

export const PUT = route(["admin"], async (req, { s }) => {
  const b = await body(req); const sets: string[] = [], a: any[] = [];
  const add = (k: string, v: any) => { a.push(v); sets.push(`${k}=$${a.length}`); };
  for (const k of TEXT) if (k in b) add(k, String(b[k] ?? "").trim() || null);
  for (const k of SECRET) if (typeof b[k] === "string" && b[k].trim()) add(k, b[k].trim());
  if ("gst_enabled" in b) add("gst_enabled", !!b.gst_enabled);
  if (["CGST_SGST", "IGST"].includes(b.gst_type)) add("gst_type", b.gst_type);
  for (const k of ["cgst", "sgst", "igst"]) if (k in b) add(k, Math.min(100, Math.max(0, num(b[k]))));
  if ("next_invoice" in b && num(b.next_invoice) >= 1) add("next_invoice", Math.floor(num(b.next_invoice)));
  if (sets.length) await q(`UPDATE company_settings SET ${sets.join(",")} WHERE id=1`, a);
  await log(s.uid, "SETTINGS_UPDATED"); return { ok: true };
});
