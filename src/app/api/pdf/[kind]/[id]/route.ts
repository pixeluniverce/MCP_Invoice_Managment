import { route, qs, isDate, HttpError } from "@/lib/api";
import { getSettings, getInvoice, getPayment, getChallan, getLedger, listInvoices } from "@/lib/data";
import { invoicePdf, receiptPdf, statementPdf, challanPdf } from "@/lib/pdf";

// All PDFs are generated on demand from the saved database records (never from client-supplied numbers).
export const GET = route(["admin", "customer"], async (req, { s, params }) => {
  const p = qs(req), scope = s.role === "customer" ? s.customerId : null, id = Number(params.id), co = await getSettings();
  let bytes: Uint8Array, name: string;
  switch (params.kind) {
    case "invoice": { const d = await getInvoice(id, scope); bytes = await invoicePdf(co, d.invoice, d.items, d.payments); name = `Invoice-${d.invoice.number}`; break; }
    case "receipt": { const d = await getPayment(id, scope); bytes = await receiptPdf(co, d.payment, d.allocations, d.remaining); name = `Receipt-${d.payment.receipt_no}`; break; }
    case "challan": { const d = await getChallan(id, scope); bytes = await challanPdf(co, d.challan, d.items); name = `Challan-${d.challan.number}`; break; }
    case "statement": case "outstanding": {
      const cid = scope || id; // customers can only ever get their own statement
      const led = await getLedger(cid, isDate(p.get("from")) ? p.get("from")! : undefined, isDate(p.get("to")) ? p.get("to")! : undefined);
      if (params.kind === "outstanding") { const pend = (await listInvoices({ cid, status: "PENDING", size: 500 })).rows; bytes = await statementPdf(co, led, pend); }
      else bytes = await statementPdf(co, led);
      name = `${params.kind === "outstanding" ? "Outstanding" : "Statement"}-${led.customer.name.replace(/\W+/g, "_")}`; break;
    }
    default: throw new HttpError(404, "Unknown document");
  }
  return new Response(bytes as any, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `${p.get("inline") ? "inline" : "attachment"}; filename="${name}.pdf"`, "Cache-Control": "private, no-store" } });
});
