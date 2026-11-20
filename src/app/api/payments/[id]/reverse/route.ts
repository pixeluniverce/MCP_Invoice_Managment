import { q } from "@/lib/db";
import { route, body, HttpError, log } from "@/lib/api";
// Reversal keeps the record for audit; allocations stop counting so invoices become pending again.
export const POST = route(["admin"], async (req, { s, params }) => {
  const b = await body(req);
  if (String(b.reason || "").trim().length < 3) throw new HttpError(400, "Enter a reason for the reversal");
  const r = await q("UPDATE payments SET status='REVERSED', reversed_at=now(), reverse_reason=$1 WHERE id=$2 AND status='ACTIVE' RETURNING receipt_no", [b.reason.trim(), Number(params.id)]);
  if (!r.length) throw new HttpError(404, "Active payment not found");
  await log(s.uid, "PAYMENT_REVERSED", `${r[0].receipt_no}: ${b.reason}`); return { ok: true };
});
