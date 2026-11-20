import { tx } from "@/lib/db";
import { route, body, need, num, isDate, qs, HttpError, log } from "@/lib/api";
import { listInvoices } from "@/lib/data";
import { calcInvoice, r2 } from "@/lib/calc";

export const GET = route(["admin", "customer"], async (req, { s }) => {
  const p = qs(req);
  // Customers are ALWAYS forced to their own customer id; any customer_id in the URL is ignored.
  const cid = s.role === "customer" ? s.customerId : p.get("customer_id") ? Number(p.get("customer_id")) : null;
  return listInvoices({ cid, status: p.get("status") || "", from: isDate(p.get("from")) ? p.get("from")! : "", to: isDate(p.get("to")) ? p.get("to")! : "",
    search: s.role === "admin" ? p.get("search") || "" : "", page: num(p.get("page"), 1), size: Math.min(100, num(p.get("size"), 25)) });
});

export const POST = route(["admin"], async (req, { s }) => {
  const b = await body(req);
  if (!isDate(b.date)) throw new HttpError(400, "Invoice date is required");
  if (b.due_date && !isDate(b.due_date)) throw new HttpError(400, "Invalid due date");
  const calc = calcInvoice({ gst_enabled: !!b.gst_enabled, gst_type: b.gst_type, cgst: num(b.cgst), sgst: num(b.sgst), igst: num(b.igst), other_charges: num(b.other_charges), items: b.items });
  const ini = b.payment && num(b.payment.amount) > 0 ? b.payment : null;
  if (ini) { if (r2(num(ini.amount)) > calc.grand_total + 0.004) throw new HttpError(400, "Initial payment exceeds invoice total"); if (!isDate(ini.date)) throw new HttpError(400, "Payment date is required"); need(ini.mode, "Payment mode is required"); }

  return await tx(async (c) => {
    const cust = (await c.query("SELECT * FROM customers WHERE id=$1 AND active", [Number(b.customer_id)])).rows[0];
    if (!cust) throw new HttpError(400, "Select an active customer");
    const co = (await c.query("UPDATE company_settings SET next_invoice=next_invoice+1 WHERE id=1 RETURNING *")).rows[0];
    // Admin verification of tax type vs place of supply
    if (b.gst_enabled && co.state && b.place_of_supply && !b.override_tax_type) {
      const same = co.state.trim().toLowerCase() === String(b.place_of_supply).trim().toLowerCase();
      if (same && calc.gst_type === "IGST") throw new HttpError(409, `Place of supply (${b.place_of_supply}) is the same state as the company (${co.state}). Intra-state sales normally use CGST + SGST. Continue with IGST anyway?`, "TAX_TYPE");
      if (!same && calc.gst_type === "CGST_SGST") throw new HttpError(409, `Place of supply (${b.place_of_supply}) differs from company state (${co.state}). Inter-state sales normally use IGST. Continue with CGST + SGST anyway?`, "TAX_TYPE");
    }
    const number = `${co.invoice_prefix || "INV-"}${String(co.next_invoice - 1).padStart(4, "0")}`;
    const snap = { name: cust.name, mobile: cust.mobile, address: cust.address, city: cust.city, state: cust.state, pin: cust.pin, gstin: cust.gstin };
    const inv = (await c.query(`INSERT INTO invoices(number,customer_id,date,due_date,place_of_supply,gst_enabled,gst_type,subtotal,discount_total,taxable_total,cgst_total,sgst_total,igst_total,other_charges,other_label,grand_total,notes,customer_snapshot,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING id`,
      [number, cust.id, b.date, b.due_date || null, b.place_of_supply || null, !!b.gst_enabled, calc.gst_type, calc.subtotal, calc.discount_total, calc.taxable_total, calc.cgst_total, calc.sgst_total, calc.igst_total, calc.other_charges, b.other_label || null, calc.grand_total, b.notes || null, JSON.stringify(snap), s.uid])).rows[0];
    for (const it of calc.items)
      await c.query(`INSERT INTO invoice_items(invoice_id,name,description,hsn,qty,unit,rate,discount,amount,taxable,cgst_rate,sgst_rate,igst_rate,cgst_amt,sgst_amt,igst_amt) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [inv.id, it.name, it.description, it.hsn, it.qty, it.unit, it.rate, it.discount, it.amount, it.taxable, it.cgst_rate, it.sgst_rate, it.igst_rate, it.cgst_amt, it.sgst_amt, it.igst_amt]);
    let paymentId = null;
    if (ini) {
      const rc = (await c.query("UPDATE company_settings SET next_receipt=next_receipt+1 WHERE id=1 RETURNING next_receipt")).rows[0];
      const pay = (await c.query(`INSERT INTO payments(receipt_no,customer_id,date,amount,mode,reference,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [`RCT-${String(rc.next_receipt - 1).padStart(4, "0")}`, cust.id, ini.date, r2(num(ini.amount)), ini.mode, ini.reference || null, s.uid])).rows[0];
      await c.query("INSERT INTO payment_allocations(payment_id,invoice_id,amount) VALUES($1,$2,$3)", [pay.id, inv.id, r2(num(ini.amount))]);
      paymentId = pay.id;
    }
    await c.query("INSERT INTO activity_logs(user_id,action,details) VALUES($1,'INVOICE_CREATED',$2)", [s.uid, number]);
    return { id: inv.id, number, payment_id: paymentId };
  });
});
