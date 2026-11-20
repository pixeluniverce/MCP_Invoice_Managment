import { route, qs, HttpError } from "@/lib/api";
import { customerSummary } from "@/lib/data";
export const GET = route(["admin", "customer"], async (req, { s }) => {
  const cid = s.role === "customer" ? s.customerId : Number(qs(req).get("customer_id"));
  if (!cid) throw new HttpError(400, "customer_id required");
  const { id, name, mobile, purchase, paid, outstanding, bills, paid_bills, unpaid_bills, partial_bills, pending_bills, last_payment, opening_balance } = await customerSummary(cid);
  return { id, name, mobile, purchase, paid, outstanding, bills, paid_bills, unpaid_bills, partial_bills, pending_bills, last_payment, opening_balance };
});
