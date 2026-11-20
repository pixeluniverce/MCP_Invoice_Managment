import { route } from "@/lib/api";
import { getInvoice, publicSettings } from "@/lib/data";
export const GET = route(["admin", "customer"], async (_r, { s, params }) => {
  const d = await getInvoice(Number(params.id), s.role === "customer" ? s.customerId : null);
  const { name, address, mobile, email, gstin, state, state_code, payment_terms } = (await publicSettings()) as any;
  return { ...d, company: { name, address, mobile, email, gstin, state, state_code, payment_terms } };
});
