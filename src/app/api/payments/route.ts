import { tx, q } from "@/lib/db";
import { route, body, num, isDate, qs, HttpError } from "@/lib/api";
import { r2 } from "@/lib/calc";

export const GET = route(["admin", "customer"], async (req, { s }) => {
  const p = qs(req); const a: any[] = [], w: string[] = [];
  const add = (v: any) => { a.push(v); return "$" + a.length; };
  if (s.role === "customer") { w.push(`p.customer_id=${add(s.customerId)}`, "p.status='ACTIVE'"); }
  else { if (p.get("customer_id")) w.push(`p.customer_id=${add(Number(p.get("customer_id")))}`); if (p.get("status")) w.push(`p.status=${add(p.get("status"))}`); }
  if (/^\d{4}-\d{2}$/.test(p.get("month") || "")) w.push(`to_char(p.date,'YYYY-MM')=${add(p.get("month"))}`);
  if (isDate(p.get("from"))) w.push(`p.date>=${add(p.get("from"))}`);
  if (isDate(p.get("to"))) w.push(`p.date<=${add(p.get("to"))}`);
  const size = Math.min(100, num(p.get("size"), 25)), off = (Math.max(1, num(p.get("page"), 1)) - 1) * size;
  const rows = await q(`SELECT p.id,p.receipt_no,p.date,p.amount,p.mode,p.reference,p.status,p.customer_id,c.name customer_name,
      (SELECT string_agg(i.number, ', ') FROM payment_allocations pa JOIN invoices i ON i.id=pa.invoice_id WHERE pa.payment_id=p.id) invoices,
      COUNT(*) OVER() total_rows FROM payments p JOIN customers c ON c.id=p.customer_id ${w.length ? "WHERE " + w.join(" AND ") : ""}
      ORDER BY p.date DESC, p.id DESC LIMIT ${size} OFFSET ${off}`, a);
  return { rows, total: rows[0]?.total_rows || 0 };
});

// Record a payment: explicit allocations, or auto (oldest invoice first). Any unallocated remainder is kept as customer advance.
export const POST = route(["admin"], async (req, { s }) => {
  const b = await body(req);
  const amount = r2(num(b.amount));
  if (!(amount > 0)) throw new HttpError(400, "Enter a payment amount");
  if (!isDate(b.date)) throw new HttpError(400, "Payment date is required");
  if (!["Cash", "UPI", "Bank Transfer", "Cheque", "Other"].includes(b.mode)) throw new HttpError(400, "Select a payment mode");
  return await tx(async (c) => {
    const cust = (await c.query("SELECT id FROM customers WHERE id=$1", [Number(b.customer_id)])).rows[0];
    if (!cust) throw new HttpError(400, "Select a customer");
    // Lock this customer's invoices so concurrent payments cannot over-allocate
    const invs = (await c.query(`SELECT i.id,i.number,i.grand_total,
      COALESCE((SELECT SUM(pa.amount) FROM payment_allocations pa JOIN payments p ON p.id=pa.payment_id AND p.status='ACTIVE' WHERE pa.invoice_id=i.id),0) paid
      FROM invoices i WHERE i.customer_id=$1 AND i.status='ACTIVE' ORDER BY i.date,i.id FOR UPDATE OF i`, [cust.id])).rows.map((r: any) => ({ ...r, grand_total: Number(r.grand_total), paid: Number(r.paid), pending: r2(Number(r.grand_total) - Number(r.paid)) }));
    let allocs: { invoice_id: number; amount: number }[] = [];
    if (b.auto) { let left = amount; for (const i of invs) { if (left <= 0.004) break; if (i.pending <= 0.004) continue; const a = r2(Math.min(left, i.pending)); allocs.push({ invoice_id: i.id, amount: a }); left = r2(left - a); } }
    else allocs = (Array.isArray(b.allocations) ? b.allocations : []).map((a: any) => ({ invoice_id: Number(a.invoice_id), amount: r2(num(a.amount)) })).filter((a: any) => a.amount > 0);
    let total = 0; const seen = new Set<number>();
    for (const a of allocs) {
      const inv = invs.find((i: any) => i.id === a.invoice_id);
      if (!inv) throw new HttpError(400, "Allocation refers to an invoice that does not belong to this customer");
      if (seen.has(a.invoice_id)) throw new HttpError(400, "Duplicate invoice in allocation"); seen.add(a.invoice_id);
      if (a.amount > inv.pending + 0.004) throw new HttpError(400, `${inv.number}: amount exceeds pending balance (${inv.pending})`);
      total = r2(total + a.amount);
    }
    if (total > amount + 0.004) throw new HttpError(400, "Allocated total exceeds payment amount");
    const rc = (await c.query("UPDATE company_settings SET next_receipt=next_receipt+1 WHERE id=1 RETURNING next_receipt")).rows[0];
    const pay = (await c.query(`INSERT INTO payments(receipt_no,customer_id,date,amount,mode,reference,notes,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,receipt_no`,
      [`RCT-${String(rc.next_receipt - 1).padStart(4, "0")}`, cust.id, b.date, amount, b.mode, b.reference || null, b.notes || null, s.uid])).rows[0];
    for (const a of allocs) await c.query("INSERT INTO payment_allocations(payment_id,invoice_id,amount) VALUES($1,$2,$3)", [pay.id, a.invoice_id, a.amount]);
    await c.query("INSERT INTO activity_logs(user_id,action,details) VALUES($1,'PAYMENT_RECORDED',$2)", [s.uid, pay.receipt_no]);
    return { id: pay.id, receipt_no: pay.receipt_no, allocated: total, advance: r2(amount - total) };
  });
});
