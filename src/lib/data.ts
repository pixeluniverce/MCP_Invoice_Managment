import { q } from "./db";
import { HttpError } from "./errors";

export async function getSettings() { return (await q("SELECT * FROM company_settings WHERE id=1"))[0] || {}; }
export async function publicSettings() {
  const s: any = await getSettings();
  const { wa_token, wa_app_secret, wa_verify_token, ...rest } = s;
  return { ...rest, wa_token_set: !!(process.env.WHATSAPP_TOKEN || wa_token), wa_app_secret_set: !!wa_app_secret, wa_verify_token_set: !!wa_verify_token };
}

// ---------- invoices (paid/pending always derived from ACTIVE payment allocations) ----------
const PAID = `COALESCE((SELECT SUM(pa.amount) FROM payment_allocations pa JOIN payments p ON p.id=pa.payment_id AND p.status='ACTIVE' WHERE pa.invoice_id=i.id),0)`;
const LAST_PAID = `(SELECT MAX(p.date) FROM payment_allocations pa JOIN payments p ON p.id=pa.payment_id AND p.status='ACTIVE' WHERE pa.invoice_id=i.id)`;
export const INV_BASE = `SELECT i.id,i.number,i.customer_id,i.date,i.due_date,i.grand_total,c.name customer_name,c.mobile,${PAID} paid,${LAST_PAID} last_paid_date
  FROM invoices i JOIN customers c ON c.id=i.customer_id WHERE i.status='ACTIVE'`;
export const INV_WRAP = `SELECT b.*, (b.grand_total-b.paid) pending,
  CASE WHEN b.grand_total-b.paid<=0.004 THEN 'PAID' WHEN b.paid<=0 THEN 'UNPAID' ELSE 'PARTIAL' END pay_status FROM (${INV_BASE}) b`;

export async function listInvoices(o: { cid?: number | null; status?: string; from?: string; to?: string; search?: string; page?: number; size?: number }) {
  const p: any[] = [], w: string[] = [];
  const add = (v: any) => { p.push(v); return "$" + p.length; };
  if (o.cid) w.push(`t.customer_id=${add(o.cid)}`);
  if (o.status === "PENDING") w.push("t.pending>0.004");
  else if (o.status && ["PAID", "UNPAID", "PARTIAL"].includes(o.status)) w.push(`t.pay_status=${add(o.status)}`);
  if (o.from) w.push(`t.date>=${add(o.from)}`);
  if (o.to) w.push(`t.date<=${add(o.to)}`);
  if (o.search) { const s = add(`%${o.search}%`); w.push(`(t.number ILIKE ${s} OR t.customer_name ILIKE ${s})`); }
  const size = Math.min(500, Math.max(1, o.size || 25)), off = (Math.max(1, o.page || 1) - 1) * size;
  const rows = await q(`SELECT t.*, COUNT(*) OVER() total_rows FROM (${INV_WRAP}) t ${w.length ? "WHERE " + w.join(" AND ") : ""} ORDER BY t.date DESC, t.id DESC LIMIT ${size} OFFSET ${off}`, p);
  return { rows, total: rows[0]?.total_rows || 0 };
}

export async function getInvoice(id: number, scopeCid?: number | null) {
  const inv = (await q(`SELECT i.*, ${PAID} paid, c.name customer_name, c.mobile, c.whatsapp_optin FROM invoices i JOIN customers c ON c.id=i.customer_id WHERE i.id=$1 AND i.status='ACTIVE'`, [id]))[0];
  if (!inv || (scopeCid && inv.customer_id !== scopeCid)) throw new HttpError(404, "Invoice not found"); // 404 (not 403) so IDs can't be probed
  inv.pending = Math.round((inv.grand_total - inv.paid) * 100) / 100;
  inv.pay_status = inv.pending <= 0.004 ? "PAID" : inv.paid <= 0 ? "UNPAID" : "PARTIAL";
  const items = await q("SELECT * FROM invoice_items WHERE invoice_id=$1 ORDER BY id", [id]);
  const payments = await q(`SELECT pa.amount, p.id payment_id, p.receipt_no, p.date, p.mode, p.reference FROM payment_allocations pa JOIN payments p ON p.id=pa.payment_id WHERE pa.invoice_id=$1 AND p.status='ACTIVE' ORDER BY p.date, p.id`, [id]);
  return { invoice: inv, items, payments };
}

// ---------- customers ----------
export function summarySql(byId: boolean) {
  const f = byId ? "AND i.customer_id=$1" : "", g = byId ? "AND customer_id=$1" : "";
  return `WITH inv AS (SELECT i.customer_id, i.grand_total, i.date, ${PAID} paid FROM invoices i WHERE i.status='ACTIVE' ${f}),
  ia AS (SELECT customer_id, SUM(grand_total) purchase, COUNT(*) bills,
    COUNT(*) FILTER (WHERE grand_total-paid<=0.004) paid_bills,
    COUNT(*) FILTER (WHERE grand_total-paid>0.004 AND paid<=0) unpaid_bills,
    COUNT(*) FILTER (WHERE grand_total-paid>0.004 AND paid>0) partial_bills,
    MIN(date) FILTER (WHERE grand_total-paid>0.004) oldest_pending FROM inv GROUP BY customer_id),
  pa AS (SELECT customer_id, SUM(amount) paid, MAX(date) last_payment FROM payments WHERE status='ACTIVE' ${g} GROUP BY customer_id)
  SELECT c.id,c.name,c.mobile,c.alt_mobile,c.address,c.city,c.state,c.pin,c.gstin,c.notes,c.active,c.whatsapp_optin,c.opening_balance,c.created_at,
    u.id login_id, u.username, u.active login_active, u.last_login,
    COALESCE(ia.purchase,0) purchase, COALESCE(pa.paid,0) paid,
    c.opening_balance+COALESCE(ia.purchase,0)-COALESCE(pa.paid,0) outstanding,
    COALESCE(ia.bills,0) bills, COALESCE(ia.paid_bills,0) paid_bills, COALESCE(ia.unpaid_bills,0) unpaid_bills, COALESCE(ia.partial_bills,0) partial_bills,
    COALESCE(ia.bills-ia.paid_bills,0) pending_bills, pa.last_payment, ia.oldest_pending
  FROM customers c LEFT JOIN ia ON ia.customer_id=c.id LEFT JOIN pa ON pa.customer_id=c.id LEFT JOIN users u ON u.customer_id=c.id`;
}
export async function customerSummary(id: number) {
  const r = (await q(summarySql(true) + " WHERE c.id=$1", [id]))[0];
  if (!r) throw new HttpError(404, "Customer not found");
  return r;
}
export async function listCustomers(o: { search?: string; page?: number; size?: number; outstanding?: boolean; sort?: string }) {
  const p: any[] = [], w: string[] = [];
  if (o.search) { p.push(`%${o.search}%`); w.push(`(s.name ILIKE $1 OR s.mobile ILIKE $1)`); }
  if (o.outstanding) w.push("s.outstanding>0.004");
  const order = ({ outstanding_desc: "s.outstanding DESC", outstanding_asc: "s.outstanding ASC", oldest: "s.oldest_pending ASC NULLS LAST", newest: "s.oldest_pending DESC NULLS LAST" } as any)[o.sort || ""] || "lower(s.name)";
  const size = Math.min(100, Math.max(1, o.size || 25)), off = (Math.max(1, o.page || 1) - 1) * size;
  const rows = await q(`SELECT s.*, COUNT(*) OVER() total_rows FROM (${summarySql(false)}) s ${w.length ? "WHERE " + w.join(" AND ") : ""} ORDER BY ${order}, s.id LIMIT ${size} OFFSET ${off}`, p);
  return { rows, total: rows[0]?.total_rows || 0 };
}

// ---------- ledger ----------
export async function getLedger(cid: number, from?: string, to?: string) {
  const c = (await q("SELECT id,name,mobile,address,city,state,pin,gstin,opening_balance FROM customers WHERE id=$1", [cid]))[0];
  if (!c) throw new HttpError(404, "Customer not found");
  const entries = await q(
    `SELECT date, created_at, 'Invoice ' || number AS description, grand_total AS debit, 0 AS credit FROM invoices WHERE customer_id=$1 AND status='ACTIVE'
     UNION ALL SELECT date, created_at, 'Payment ' || receipt_no || ' (' || mode || ')', 0, amount FROM payments WHERE customer_id=$1 AND status='ACTIVE'
     ORDER BY date, created_at`, [cid]);
  let bal = Number(c.opening_balance);
  const rows: any[] = []; let opening = bal, td = 0, tc = 0;
  for (const e of entries) {
    const before = from && e.date < from, after = to && e.date > to;
    if (after) break;
    bal = Math.round((bal + Number(e.debit) - Number(e.credit)) * 100) / 100;
    if (before) { opening = bal; continue; }
    td += Number(e.debit); tc += Number(e.credit);
    rows.push({ date: e.date, description: e.description, debit: Number(e.debit), credit: Number(e.credit), balance: bal });
  }
  return { customer: c, from: from || null, to: to || null, opening, rows, total_debit: Math.round(td * 100) / 100, total_credit: Math.round(tc * 100) / 100, closing: bal };
}

// ---------- payments ----------
export async function getPayment(id: number, scopeCid?: number | null) {
  const p = (await q(`SELECT p.*, c.name customer_name, c.mobile, c.whatsapp_optin FROM payments p JOIN customers c ON c.id=p.customer_id WHERE p.id=$1 AND p.status='ACTIVE'`, [id]))[0];
  if (!p || (scopeCid && p.customer_id !== scopeCid)) throw new HttpError(404, "Receipt not found");
  const allocations = await q(`SELECT i.number, pa.amount FROM payment_allocations pa JOIN invoices i ON i.id=pa.invoice_id WHERE pa.payment_id=$1 ORDER BY i.id`, [id]);
  const s = await customerSummary(p.customer_id);
  return { payment: p, allocations, remaining: s.outstanding };
}

// ---------- challans ----------
export async function getChallan(id: number, scopeCid?: number | null) {
  const ch = (await q(`SELECT d.*, c.name customer_name, c.mobile, c.whatsapp_optin FROM delivery_challans d JOIN customers c ON c.id=d.customer_id WHERE d.id=$1`, [id]))[0];
  if (!ch || (scopeCid && ch.customer_id !== scopeCid)) throw new HttpError(404, "Challan not found");
  const items = await q("SELECT * FROM challan_items WHERE challan_id=$1 ORDER BY id", [id]);
  return { challan: ch, items };
}
