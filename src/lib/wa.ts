import { getSettings } from "./data";
import { HttpError } from "./errors";

export async function waConfig() {
  const s: any = await getSettings();
  return { phoneId: s.wa_phone_id, token: process.env.WHATSAPP_TOKEN || s.wa_token, ver: s.wa_api_version || "v21.0", template: s.wa_template_name, lang: s.wa_template_lang || "en", s };
}
export function normMobile(m: any) {
  let d = String(m || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("0")) d = "91" + d.slice(1);
  if (d.length === 10) d = "91" + d;
  return d;
}
const fail = async (r: Response, fallback: string) => { const j: any = await r.json().catch(() => ({})); return new Error(j?.error?.message || fallback); };

// Uploads the PDF to WhatsApp media, then sends it as a document (or as an approved template with a document header).
export async function waSendDocument(o: { to: string; pdf: Uint8Array; filename: string; caption: string; summary: string }) {
  const c = await waConfig();
  if (!c.phoneId || !c.token) throw new HttpError(400, "WhatsApp Cloud API is not configured (Settings > WhatsApp)");
  const base = `https://graph.facebook.com/${c.ver}/${c.phoneId}`;
  const fd = new FormData();
  fd.append("messaging_product", "whatsapp"); fd.append("type", "application/pdf");
  fd.append("file", new Blob([o.pdf as any], { type: "application/pdf" }), o.filename);
  const up = await fetch(`${base}/media`, { method: "POST", headers: { Authorization: `Bearer ${c.token}` }, body: fd });
  if (!up.ok) throw await fail(up, "Media upload failed");
  const mediaId = ((await up.json()) as any).id;
  const payload: any = c.template
    ? { messaging_product: "whatsapp", to: o.to, type: "template", template: { name: c.template, language: { code: c.lang }, components: [
        { type: "header", parameters: [{ type: "document", document: { id: mediaId, filename: o.filename } }] },
        { type: "body", parameters: [{ type: "text", text: o.summary.slice(0, 900) }] }] } }
    : { messaging_product: "whatsapp", to: o.to, type: "document", document: { id: mediaId, filename: o.filename, caption: o.caption.slice(0, 1000) } };
  const r = await fetch(`${base}/messages`, { method: "POST", headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!r.ok) throw await fail(r, "Send failed");
  return ((await r.json()) as any).messages?.[0]?.id as string;
}

export async function waTest() {
  const c = await waConfig();
  if (!c.phoneId || !c.token) throw new HttpError(400, "Enter Phone Number ID and Access Token first");
  const r = await fetch(`https://graph.facebook.com/${c.ver}/${c.phoneId}?fields=display_phone_number,verified_name,quality_rating`, { headers: { Authorization: `Bearer ${c.token}` } });
  if (!r.ok) throw await fail(r, "Connection failed");
  return await r.json();
}
