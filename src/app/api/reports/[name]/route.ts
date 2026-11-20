import { q } from "@/lib/db";
import { route, qs, isDate, HttpError } from "@/lib/api";
import { INV_WRAP, summarySql } from "@/lib/data";

const R: Record<string, string> = {
  "daily-sales": `SELECT date, COUNT(*) invoices, SUM(taxable_total) taxable, SUM(cgst_total+sgst_total+igst_total) gst, SUM(grand_total) total FROM invoices WHERE status='ACTIVE' AND date BETWEEN $1 AND $2 GROUP BY date ORDER BY date`,
  "monthly-sales": `SELECT to_char(date,'YYYY-MM') month, COUNT(*) invoices, SUM(taxable_total) taxable, SUM(cgst_total+sgst_total+igst_total) gst, SUM(grand_total) total FROM invoices WHERE status='ACTIVE' AND date BETWEEN $1 AND $2 GROUP BY 1 ORDER BY 1`,
  "yearly-sales": `SELECT to_char(date,'YYYY') year, COUNT(*) invoices, SUM(taxable_total) taxable, SUM(cgst_total+sgst_total+igst_total) gst, SUM(grand_total) total FROM invoices WHERE status='ACTIVE' AND date BETWEEN $1 AND $2 GROUP BY 1 ORDER BY 1`,
  "daily-collection": `SELECT date, COUNT(*) payments, SUM(amount) collected FROM payments WHERE status='ACTIVE' AND date BETWEEN $1 AND $2 GROUP BY date ORDER BY date`,
  "monthly-collection": `SELECT to_char(date,'YYYY-MM') month, COUNT(*) payments, SUM(amount) collected FROM payments WHERE status='ACTIVE' AND date BETWEEN $1 AND $2 GROUP BY 1 ORDER BY 1`,
  "customer-outstanding": `SELECT s.name customer, s.mobile, s.purchase, s.paid, s.outstanding, s.pending_bills, s.last_payment FROM (${summarySql(false)}) s WHERE s.outstanding>0.004 AND ($1::text IS NOT NULL AND $2::text IS NOT NULL) ORDER BY s.outstanding DESC`,
  "invoice-payment": `SELECT number invoice, date, customer_name customer, grand_total total, paid, pending, pay_status status FROM (${INV_WRAP}) t WHERE date BETWEEN $1 AND $2 ORDER BY date, number`,
  "paid-vs-unpaid": `SELECT pay_status status, COUNT(*) invoices, SUM(grand_total) total, SUM(paid) paid, SUM(pending) pending FROM (${INV_WRAP}) t WHERE date BETWEEN $1 AND $2 GROUP BY 1`,
  "product-sales": `SELECT it.name product, it.unit, SUM(it.qty) quantity, SUM(it.taxable) taxable_amount FROM invoice_items it JOIN invoices i ON i.id=it.invoice_id WHERE i.status='ACTIVE' AND i.date BETWEEN $1 AND $2 GROUP BY it.name, it.unit ORDER BY 4 DESC`,
  "gst-summary": `SELECT (it.cgst_rate+it.sgst_rate+it.igst_rate) gst_percent, SUM(it.taxable) taxable, SUM(it.cgst_amt) cgst, SUM(it.sgst_amt) sgst, SUM(it.igst_amt) igst FROM invoice_items it JOIN invoices i ON i.id=it.invoice_id WHERE i.status='ACTIVE' AND i.gst_enabled AND i.date BETWEEN $1 AND $2 GROUP BY 1 ORDER BY 1`,
  "challans": `SELECT d.number, d.date, c.name customer, d.vehicle_no, d.transport FROM delivery_challans d JOIN customers c ON c.id=d.customer_id WHERE d.date BETWEEN $1 AND $2 ORDER BY d.date`,
  "whatsapp": `SELECT m.created_at, c.name customer, m.mobile, m.type, m.ref_label reference, m.status FROM whatsapp_messages m LEFT JOIN customers c ON c.id=m.customer_id WHERE m.created_at::date BETWEEN $1 AND $2 ORDER BY m.created_at DESC LIMIT 5000`,
};
export const GET = route(["admin"], async (req, { params }) => {
  const sql = R[params.name]; if (!sql) throw new HttpError(404, "Unknown report");
  const p = qs(req); const from = isDate(p.get("from")) ? p.get("from") : "1900-01-01", to = isDate(p.get("to")) ? p.get("to") : "2999-12-31";
  const rows = await q(sql, [from, to]);
  if (p.get("format") === "csv") {
    const cols = rows[0] ? Object.keys(rows[0]) : [], esc = (v: any) => `"${String(v instanceof Date ? v.toISOString() : v ?? "").replace(/"/g, '""')}"`;
    return new Response([cols.join(","), ...rows.map(r => cols.map(c => esc(r[c])).join(","))].join("\n"), { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${params.name}.csv"` } });
  }
  return { rows };
});
