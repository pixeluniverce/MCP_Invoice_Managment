import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { fdate } from "./fmt";

// Standard PDF fonts only support Latin characters; anything else (e.g. Gujarati) prints as "?".
const clean = (s: any) => String(s ?? "").replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
const rs = (n: any) => "Rs. " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const BLUE = rgb(0.15, 0.39, 0.92), GREY = rgb(0.94, 0.95, 0.96), LINE = rgb(0.85, 0.87, 0.9), WHITE = rgb(1, 1, 1);
type Col = { h: string; w: number; a?: "r" };

class Doc {
  pdf!: PDFDocument; f: any; b: any; page: any; y = 0; W = 595.28; H = 841.89; M = 40; co: any; title = "";
  static async make(co: any, title: string, no?: string, date?: string) {
    const d = new Doc(); d.pdf = await PDFDocument.create();
    d.f = await d.pdf.embedFont(StandardFonts.Helvetica); d.b = await d.pdf.embedFont(StandardFonts.HelveticaBold);
    d.co = co; d.title = title; d.newPage(); d.head(no, date); return d;
  }
  newPage() { this.page = this.pdf.addPage([this.W, this.H]); this.y = this.H - this.M; }
  t(text: any, x: number, y: number, o: { size?: number; b?: boolean; align?: "left" | "right" | "center"; w?: number; color?: any } = {}) {
    const size = o.size || 9, f = o.b ? this.b : this.f, s = clean(text), tw = f.widthOfTextAtSize(s, size);
    let X = x; if (o.align === "right") X = x + (o.w || 0) - tw; else if (o.align === "center") X = x + ((o.w || 0) - tw) / 2;
    this.page.drawText(s, { x: X, y, size, font: f, color: o.color || rgb(0.12, 0.14, 0.17) });
  }
  fit(s: any, w: number, size = 8) { let t = clean(s); while (t.length > 1 && this.f.widthOfTextAtSize(t, size) > w) t = t.slice(0, -1); return t; }
  head(no?: string, date?: string) {
    this.page.drawRectangle({ x: 0, y: this.H - 70, width: this.W, height: 70, color: BLUE });
    this.t(this.co.name, this.M, this.H - 36, { size: 20, b: true, color: WHITE });
    const sub = [this.co.address, this.co.mobile && "Mob: " + this.co.mobile, this.co.gstin && "GSTIN: " + this.co.gstin].filter(Boolean).join("  |  ");
    this.t(this.fit(sub, this.W - 2 * this.M), this.M, this.H - 56, { size: 8, color: WHITE });
    this.y = this.H - 95;
    this.t(this.title, this.M, this.y, { size: 15, b: true });
    if (no) this.t(`No: ${no}    Date: ${fdate(date)}`, this.M, this.y, { size: 9, align: "right", w: this.W - 2 * this.M });
    this.y -= 24;
  }
  ensure(h: number) { if (this.y - h < this.M + 30) this.newPage(); }
  lines(lines: string[], x: number, size = 9, boldFirst = false) { lines.filter(Boolean).forEach((l, i) => { this.t(l, x, this.y, { size, b: boldFirst && i === 0 }); this.y -= size + 3; }); }
  twoCols(left: string[], right: string[]) {
    const top = this.y; this.lines(left, this.M, 9, true); const ly = this.y; this.y = top; this.lines(right, this.W / 2 + 20, 9); this.y = Math.min(ly, this.y) - 8;
  }
  table(cols: Col[], rows: any[][]) {
    const tw = cols.reduce((a, c) => a + c.w, 0);
    const hdr = () => { this.page.drawRectangle({ x: this.M, y: this.y - 5, width: tw, height: 16, color: GREY }); let x = this.M; cols.forEach(c => { this.t(c.h, x + 3, this.y, { size: 8, b: true, align: c.a === "r" ? "right" : "left", w: c.w - 6 }); x += c.w; }); this.y -= 18; };
    this.ensure(50); hdr();
    for (const r of rows) {
      if (this.y < this.M + 40) { this.newPage(); hdr(); }
      let x = this.M; r.forEach((v, i) => { const c = cols[i]; this.t(this.fit(v, c.w - 6), x + 3, this.y, { size: 8, align: c.a === "r" ? "right" : "left", w: c.w - 6 }); x += c.w; });
      this.page.drawLine({ start: { x: this.M, y: this.y - 4 }, end: { x: this.M + tw, y: this.y - 4 }, thickness: 0.4, color: LINE });
      this.y -= 15;
    }
    this.y -= 6;
  }
  totals(pairs: [string, string, boolean?][]) {
    const x = this.W - this.M - 240; this.ensure(pairs.length * 15 + 10);
    for (const [l, v, bold] of pairs) { this.t(l, x, this.y, { size: bold ? 10 : 9, b: !!bold }); this.t(v, x, this.y, { size: bold ? 10 : 9, b: !!bold, align: "right", w: 240 }); this.y -= bold ? 17 : 14; }
    this.y -= 4;
  }
  sign(leftLabel?: string) {
    this.ensure(90); this.y -= 40; const yy = this.y;
    this.page.drawLine({ start: { x: this.W - this.M - 170, y: yy }, end: { x: this.W - this.M, y: yy }, thickness: 0.6, color: LINE });
    this.t("For " + this.co.name, this.W - this.M - 170, yy + 8, { size: 8, b: true }); this.t("Authorised Signatory", this.W - this.M - 170, yy - 11, { size: 8 });
    if (leftLabel) { this.page.drawLine({ start: { x: this.M, y: yy }, end: { x: this.M + 170, y: yy }, thickness: 0.6, color: LINE }); this.t(leftLabel, this.M, yy - 11, { size: 8 }); }
  }
  async save() { return await this.pdf.save(); }
}

const custLines = (c: any) => [c.name, c.address, [c.city, c.state, c.pin].filter(Boolean).join(", "), c.mobile && "Mobile: " + c.mobile, c.gstin && "GSTIN: " + c.gstin];

export async function invoicePdf(co: any, inv: any, items: any[], payments: any[]) {
  const gst = inv.gst_enabled;
  const d = await Doc.make(co, gst ? "TAX INVOICE" : "INVOICE", inv.number, inv.date);
  d.twoCols(["Bill To:", ...custLines(inv.customer_snapshot || { name: inv.customer_name, mobile: inv.mobile })],
    [`Invoice No: ${inv.number}`, `Invoice Date: ${fdate(inv.date)}`, `Due Date: ${fdate(inv.due_date)}`, inv.place_of_supply && `Place of Supply: ${inv.place_of_supply}`]);
  if (gst) {
    d.table([{ h: "#", w: 20 }, { h: "Item (HSN)", w: 150 }, { h: "Qty", w: 55, a: "r" }, { h: "Rate", w: 60, a: "r" }, { h: "Disc.", w: 50, a: "r" }, { h: "Taxable", w: 65, a: "r" }, { h: "GST %", w: 50, a: "r" }, { h: "Total", w: 65, a: "r" }],
      items.map((x, i) => [i + 1, x.name + (x.hsn ? ` (${x.hsn})` : ""), `${x.qty} ${x.unit || ""}`, x.rate.toFixed(2), x.discount.toFixed(2), x.taxable.toFixed(2), (x.cgst_rate + x.sgst_rate + x.igst_rate).toString(), (x.taxable + x.cgst_amt + x.sgst_amt + x.igst_amt).toFixed(2)]));
  } else {
    d.table([{ h: "#", w: 20 }, { h: "Item", w: 215 }, { h: "Qty", w: 70, a: "r" }, { h: "Rate", w: 70, a: "r" }, { h: "Disc.", w: 60, a: "r" }, { h: "Amount", w: 80, a: "r" }],
      items.map((x, i) => [i + 1, x.name, `${x.qty} ${x.unit || ""}`, x.rate.toFixed(2), x.discount.toFixed(2), x.taxable.toFixed(2)]));
  }
  const tl: [string, string, boolean?][] = [["Amount", rs(inv.subtotal)], ["Discount", "- " + rs(inv.discount_total)], ["Taxable Amount", rs(inv.taxable_total)]];
  if (gst && inv.gst_type === "CGST_SGST") { tl.push(["CGST", rs(inv.cgst_total)], ["SGST", rs(inv.sgst_total)]); }
  if (gst && inv.gst_type === "IGST") tl.push(["IGST", rs(inv.igst_total)]);
  if (inv.other_charges > 0) tl.push([inv.other_label || "Additional Charges", rs(inv.other_charges)]);
  tl.push(["Grand Total", rs(inv.grand_total), true], ["Amount Paid", rs(inv.paid)], ["Balance Due", rs(inv.pending), true]);
  d.totals(tl);
  if (payments.length) { d.ensure(40); d.t("Payments received", d.M, d.y, { b: true }); d.y -= 14; d.table([{ h: "Receipt", w: 130 }, { h: "Date", w: 100 }, { h: "Mode", w: 100 }, { h: "Reference", w: 100 }, { h: "Amount", w: 85, a: "r" }], payments.map(p => [p.receipt_no, fdate(p.date), p.mode, p.reference || "-", p.amount.toFixed(2)])); }
  if (inv.notes) { d.ensure(30); d.t("Notes: " + inv.notes, d.M, d.y, { size: 8 }); d.y -= 12; }
  if (co.payment_terms) { d.ensure(30); d.t("Terms: " + co.payment_terms, d.M, d.y, { size: 8 }); d.y -= 12; }
  d.sign("Customer Signature"); return d.save();
}

export async function receiptPdf(co: any, p: any, allocations: any[], remaining: number) {
  const d = await Doc.make(co, "PAYMENT RECEIPT", p.receipt_no, p.date);
  d.twoCols(["Received From:", p.customer_name, p.mobile && "Mobile: " + p.mobile], [`Receipt No: ${p.receipt_no}`, `Date: ${fdate(p.date)}`, `Mode: ${p.mode}`, p.reference && `Reference: ${p.reference}`]);
  d.totals([["Amount Received", rs(p.amount), true], ["Remaining Outstanding", rs(remaining), true]]);
  if (allocations.length) { d.t("Applied to invoices", d.M, d.y, { b: true }); d.y -= 14; d.table([{ h: "Invoice", w: 300 }, { h: "Amount", w: 215, a: "r" }], allocations.map(a => [a.number, a.amount.toFixed(2)])); }
  const adv = p.amount - allocations.reduce((s, a) => s + a.amount, 0);
  if (adv > 0.004) { d.t("Advance / unallocated: " + rs(adv), d.M, d.y, { size: 9 }); d.y -= 14; }
  d.sign(); return d.save();
}

export async function statementPdf(co: any, led: any, pendingInvoices?: any[]) {
  const outstanding = !!pendingInvoices;
  const d = await Doc.make(co, outstanding ? "OUTSTANDING STATEMENT" : "ACCOUNT STATEMENT");
  d.twoCols(custLines(led.customer), [`Statement Period: ${led.from ? fdate(led.from) : "Beginning"} to ${led.to ? fdate(led.to) : fdate(new Date(Date.now() + 19800000).toISOString())}`, `Closing Balance: ${rs(led.closing)}`]);
  if (outstanding) {
    d.table([{ h: "Invoice", w: 110 }, { h: "Date", w: 85 }, { h: "Due", w: 85 }, { h: "Total", w: 80, a: "r" }, { h: "Paid", w: 75, a: "r" }, { h: "Pending", w: 80, a: "r" }],
      pendingInvoices!.map(i => [i.number, fdate(i.date), fdate(i.due_date), i.grand_total.toFixed(2), i.paid.toFixed(2), i.pending.toFixed(2)]));
    d.totals([["Total Outstanding", rs(led.closing), true]]);
  } else {
    d.table([{ h: "Date", w: 70 }, { h: "Description", w: 215 }, { h: "Debit", w: 75, a: "r" }, { h: "Credit", w: 75, a: "r" }, { h: "Balance", w: 80, a: "r" }],
      [["", "Opening Balance", "", "", led.opening.toFixed(2)], ...led.rows.map((r: any) => [fdate(r.date), r.description, r.debit ? r.debit.toFixed(2) : "", r.credit ? r.credit.toFixed(2) : "", r.balance.toFixed(2)])]);
    d.totals([["Total Debit (Invoices)", rs(led.total_debit)], ["Total Credit (Payments)", rs(led.total_credit)], ["Closing Balance", rs(led.closing), true]]);
  }
  d.sign(); return d.save();
}

export async function challanPdf(co: any, ch: any, items: any[]) {
  const d = await Doc.make(co, "DELIVERY CHALLAN", ch.number, ch.date);
  d.twoCols(["Deliver To:", ...custLines(ch.customer_snapshot || { name: ch.customer_name, mobile: ch.mobile })], [`Challan No: ${ch.number}`, `Date: ${fdate(ch.date)}`, ch.vehicle_no && `Vehicle No: ${ch.vehicle_no}`, ch.transport && `Transport: ${ch.transport}`]);
  d.table([{ h: "#", w: 25 }, { h: "Product", w: 190 }, { h: "Description", w: 190 }, { h: "Qty", w: 60, a: "r" }, { h: "Unit", w: 50 }], items.map((x, i) => [i + 1, x.name, x.description || "", x.qty, x.unit || ""]));
  if (ch.notes) { d.t("Notes: " + ch.notes, d.M, d.y, { size: 8 }); d.y -= 12; }
  d.t("Goods received in good condition.", d.M, d.y - 6, { size: 8 }); d.sign("Receiver Signature"); return d.save();
}
