import { q } from "./db";
import { HttpError } from "./errors";
import { getSettings, getInvoice, getPayment, getChallan, getLedger, customerSummary, listInvoices } from "./data";
import { invoicePdf, receiptPdf, statementPdf, challanPdf } from "./pdf";
import { waSendDocument, normMobile } from "./wa";
import { fdate, inr } from "./fmt";

export type WaType = "invoice" | "receipt" | "reminder" | "statement" | "challan";

export async function sendWA(o: { type: WaType; id?: number; customer_id?: number; userId: number; force?: boolean }) {
  const co: any = await getSettings();
  let cid = 0, pdf: Uint8Array, filename = "", text = "", summary = "", refId: number | null = null, refLabel = "", pdfUrl = "";
  const sign = `\n\nThank you.\n${co.name}`;
  if (o.type === "invoice") {
    const { invoice: i, items, payments } = await getInvoice(Number(o.id));
    cid = i.customer_id; refId = i.id; refLabel = i.number; filename = `Invoice-${i.number}.pdf`; pdfUrl = `/api/pdf/invoice/${i.id}`;
    pdf = await invoicePdf(co, i, items, payments);
    text = `Hello ${i.customer_name},\n\nThank you for your purchase from ${co.name}.\n\nYour invoice details:\n\nInvoice Number: ${i.number}\nInvoice Date: ${fdate(i.date)}\nInvoice Amount: ${inr(i.grand_total)}\nPaid Amount: ${inr(i.paid)}\nPending Amount: ${inr(i.pending)}\n\nPlease find your invoice attached.\n\nThank you for your business.\n${co.name}`;
    summary = `Invoice ${i.number} dated ${fdate(i.date)}. Amount ${inr(i.grand_total)}, paid ${inr(i.paid)}, pending ${inr(i.pending)}.`;
  } else if (o.type === "receipt") {
    const { payment: p, allocations, remaining } = await getPayment(Number(o.id));
    cid = p.customer_id; refId = p.id; refLabel = p.receipt_no; filename = `Receipt-${p.receipt_no}.pdf`; pdfUrl = `/api/pdf/receipt/${p.id}`;
    pdf = await receiptPdf(co, p, allocations, remaining);
    text = `Hello ${p.customer_name},\n\nWe have successfully received your payment.\n\nPayment Details:\n\nReceipt Number: ${p.receipt_no}\nPayment Date: ${fdate(p.date)}\nAmount Received: ${inr(p.amount)}\nPayment Mode: ${p.mode}\nRemaining Outstanding: ${inr(remaining)}${sign}`;
    summary = `Receipt ${p.receipt_no}: ${inr(p.amount)} received via ${p.mode}. Remaining outstanding ${inr(remaining)}.`;
  } else if (o.type === "reminder" || o.type === "statement") {
    cid = Number(o.customer_id); const s = await customerSummary(cid); const led = await getLedger(cid);
    filename = `${o.type === "reminder" ? "Outstanding" : "Statement"}-${s.name.replace(/\W+/g, "_")}.pdf`;
    pdfUrl = `/api/pdf/${o.type === "reminder" ? "outstanding" : "statement"}/${cid}`;
    if (o.type === "reminder") {
      if (s.outstanding <= 0.004) throw new HttpError(400, "This customer has no outstanding balance");
      const pend = (await listInvoices({ cid, status: "PENDING", size: 500 })).rows;
      pdf = await statementPdf(co, led, pend);
      text = `Hello ${s.name},\n\nThis is a friendly payment reminder from ${co.name}.\n\nYour outstanding payment details:\n\nTotal Outstanding: ${inr(s.outstanding)}\nPending Bills: ${s.pending_bills}\n\nPlease review your pending invoices and arrange payment when convenient.\n\nFor bill details, please check the attached statement.${sign}`;
      summary = `Payment reminder. Total outstanding ${inr(s.outstanding)} across ${s.pending_bills} pending bills.`;
    } else {
      pdf = await statementPdf(co, led);
      text = `Hello ${s.name},\n\nPlease find your account statement from ${co.name} attached.\n\nOutstanding balance: ${inr(s.outstanding)}${sign}`;
      summary = `Account statement. Closing balance ${inr(led.closing)}.`;
    }
    refLabel = o.type;
  } else if (o.type === "challan") {
    const { challan: ch, items } = await getChallan(Number(o.id));
    cid = ch.customer_id; refId = ch.id; refLabel = ch.number; filename = `Challan-${ch.number}.pdf`; pdfUrl = `/api/pdf/challan/${ch.id}`;
    pdf = await challanPdf(co, ch, items);
    text = `Hello ${ch.customer_name},\n\nYour delivery challan ${ch.number} dated ${fdate(ch.date)} from ${co.name} is attached.${sign}`;
    summary = `Delivery challan ${ch.number} dated ${fdate(ch.date)}.`;
  } else throw new HttpError(400, "Unknown message type");

  const cust = (await q("SELECT mobile, whatsapp_optin FROM customers WHERE id=$1", [cid]))[0];
  if (!cust) throw new HttpError(404, "Customer not found");
  const to = normMobile(cust.mobile);
  const fallback = { url: `https://wa.me/${to}?text=${encodeURIComponent(text)}`, pdfUrl, text };
  if (!cust.whatsapp_optin) throw new HttpError(400, "Customer has not opted in to WhatsApp messages");
  if (to.length < 12) throw new HttpError(400, "Customer mobile number is invalid");
  if (!o.force) {
    const dup = await q(`SELECT 1 FROM whatsapp_messages WHERE customer_id=$1 AND type=$2 AND ref_id IS NOT DISTINCT FROM $3 AND status<>'FAILED' AND created_at>now()-interval '2 minutes' LIMIT 1`, [cid, o.type, refId]);
    if (dup.length) throw new HttpError(409, "This message was already sent in the last 2 minutes");
  }
  const row = (await q(`INSERT INTO whatsapp_messages(customer_id,mobile,type,ref_id,ref_label,status,sent_by) VALUES($1,$2,$3,$4,$5,'PENDING',$6) RETURNING id`, [cid, to, o.type, refId, refLabel, o.userId]))[0];
  try {
    const mid = await waSendDocument({ to, pdf, filename, caption: text, summary });
    await q("UPDATE whatsapp_messages SET status='SENT', wa_message_id=$1, updated_at=now() WHERE id=$2", [mid, row.id]); // 'SENT' = accepted by WhatsApp; delivered/read only via webhook
    return { id: row.id, status: "SENT" };
  } catch (e: any) {
    await q("UPDATE whatsapp_messages SET status='FAILED', error=$1, updated_at=now() WHERE id=$2", [String(e.message).slice(0, 500), row.id]);
    const err: any = new HttpError(e.status || 502, e.message); err.fallback = fallback; throw err;
  }
}
