import crypto from "crypto";
import { q } from "@/lib/db";
import { getSettings } from "@/lib/data";
export const dynamic = "force-dynamic";

// Meta verification handshake
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams; const s: any = await getSettings();
  if (p.get("hub.mode") === "subscribe" && s.wa_verify_token && p.get("hub.verify_token") === s.wa_verify_token) return new Response(p.get("hub.challenge") || "", { status: 200 });
  return new Response("Forbidden", { status: 403 });
}

const RANK: any = { PENDING: 0, SENT: 1, DELIVERED: 2, READ: 3 };
// Delivery / read states are written ONLY from here (confirmed by WhatsApp).
export async function POST(req: Request) {
  const raw = await req.text(); const s: any = await getSettings();
  if (s.wa_app_secret) {
    const sig = req.headers.get("x-hub-signature-256") || "";
    const exp = "sha256=" + crypto.createHmac("sha256", s.wa_app_secret).update(raw).digest("hex");
    if (sig.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return new Response("Bad signature", { status: 401 });
  }
  let payload: any; try { payload = JSON.parse(raw); } catch { return new Response("Bad request", { status: 400 }); }
  await q("INSERT INTO whatsapp_webhook_events(payload) VALUES($1)", [JSON.stringify(payload)]).catch(() => {});
  for (const e of payload.entry || []) for (const ch of e.changes || []) for (const st of ch.value?.statuses || []) {
    const next = String(st.status || "").toUpperCase();
    const row = (await q("SELECT id,status FROM whatsapp_messages WHERE wa_message_id=$1", [st.id]))[0];
    if (!row) continue;
    if (next === "FAILED") await q("UPDATE whatsapp_messages SET status='FAILED', error=$1, updated_at=now() WHERE id=$2", [st.errors?.[0]?.title || "Failed", row.id]);
    else if (next in RANK && RANK[next] > (RANK[row.status] ?? -1)) await q("UPDATE whatsapp_messages SET status=$1, updated_at=now() WHERE id=$2", [next, row.id]);
  }
  return new Response("ok", { status: 200 });
}
