import { route, body } from "@/lib/api";
import { sendWA } from "@/lib/wasend";
export const POST = route(["admin"], async (req, { s }) => {
  const b = await body(req);
  return await sendWA({ type: b.type, id: b.id, customer_id: b.customer_id, userId: s.uid });
});
