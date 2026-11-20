import { q } from "@/lib/db";
import { route, HttpError } from "@/lib/api";
import { sendWA } from "@/lib/wasend";
export const POST = route(["admin"], async (_r, { s, params }) => {
  const m = (await q("SELECT * FROM whatsapp_messages WHERE id=$1", [Number(params.id)]))[0];
  if (!m) throw new HttpError(404, "Message not found");
  if (m.status !== "FAILED") throw new HttpError(400, "Only failed messages can be retried");
  return await sendWA({ type: m.type, id: m.ref_id, customer_id: m.customer_id, userId: s.uid, force: true });
});
