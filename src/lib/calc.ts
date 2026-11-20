// Shared by server (authoritative) and browser (live preview).
import { HttpError } from "./errors";
export const r2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export function calcInvoice(i: { gst_enabled: boolean; gst_type: string; cgst: number; sgst: number; igst: number; other_charges?: number; items: any[] }) {
  const gst = !!i.gst_enabled;
  const type = gst ? i.gst_type : "NONE";
  if (gst && !["CGST_SGST", "IGST"].includes(type)) throw new HttpError(400, "Invalid GST type");
  const rate = (v: any) => { const n = Number(v); if (!(n >= 0 && n <= 100)) throw new HttpError(400, "GST % must be between 0 and 100"); return n; };
  const items = (i.items || []).map((it: any) => {
    if (!String(it.name || "").trim()) throw new HttpError(400, "Every item needs a name");
    const qty = Number(it.qty), unitRate = Number(it.rate), discount = Number(it.discount || 0);
    if (!(qty > 0) || !(unitRate >= 0) || !(discount >= 0)) throw new HttpError(400, "Invalid quantity, rate or discount");
    const amount = r2(qty * unitRate), taxable = r2(amount - discount);
    if (taxable < 0) throw new HttpError(400, "Discount cannot exceed amount");
    let cr = 0, sr = 0, ir = 0;
    if (gst) {
      const hasOverride = it.gst_rate !== undefined && it.gst_rate !== null && it.gst_rate !== "";
      const over = hasOverride ? rate(it.gst_rate) : null;
      if (type === "IGST") ir = over ?? rate(i.igst);
      else if (over !== null) { cr = over / 2; sr = over / 2; } // item-wise total rate split equally
      else { cr = rate(i.cgst); sr = rate(i.sgst); }
    }
    return {
      name: String(it.name).trim(), description: it.description || "", hsn: it.hsn || "", qty, unit: it.unit || "Nos", rate: unitRate, discount,
      amount, taxable, cgst_rate: cr, sgst_rate: sr, igst_rate: ir,
      cgst_amt: r2(taxable * cr / 100), sgst_amt: r2(taxable * sr / 100), igst_amt: r2(taxable * ir / 100),
    };
  });
  if (!items.length) throw new HttpError(400, "Add at least one item");
  const sum = (k: string) => r2(items.reduce((a: number, x: any) => a + x[k], 0));
  const other = r2(Number(i.other_charges || 0));
  if (other < 0) throw new HttpError(400, "Additional charges cannot be negative");
  const t = { subtotal: sum("amount"), discount_total: sum("discount"), taxable_total: sum("taxable"), cgst_total: sum("cgst_amt"), sgst_total: sum("sgst_amt"), igst_total: sum("igst_amt") };
  return { gst_type: type, items, ...t, other_charges: other, grand_total: r2(t.taxable_total + t.cgst_total + t.sgst_total + t.igst_total + other) };
}
