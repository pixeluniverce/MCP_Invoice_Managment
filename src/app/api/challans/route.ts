import { tx, q } from "@/lib/db";
import { route, body, num, isDate, qs, HttpError } from "@/lib/api";

export const GET = route(["admin", "customer"], async (req, { s }) => {
  const p = qs(req); const a: any[] = [], w: string[] = [];
  if (s.role === "customer") { a.push(s.customerId); w.push("d.customer_id=$1"); } else if (p.get("customer_id")) { a.push(Number(p.get("customer_id"))); w.push("d.customer_id=$1"); }
  const size = Math.min(100, num(p.get("size"), 25)), off = (Math.max(1, num(p.get("page"), 1)) - 1) * size;
  const rows = await q(`SELECT d.id,d.number,d.date,d.vehicle_no,d.transport,c.name customer_name,
    (SELECT string_agg(name || ' x ' || qty || ' ' || COALESCE(unit,''), '; ') FROM challan_items WHERE challan_id=d.id) items, COUNT(*) OVER() total_rows
    FROM delivery_challans d JOIN customers c ON c.id=d.customer_id ${w.length ? "WHERE " + w.join(" AND ") : ""} ORDER BY d.date DESC, d.id DESC LIMIT ${size} OFFSET ${off}`, a);
  return { rows, total: rows[0]?.total_rows || 0 };
});

export const POST = route(["admin"], async (req, { s }) => {
  const b = await body(req);
  if (!isDate(b.date)) throw new HttpError(400, "Challan date is required");
  const items = (b.items || []).filter((i: any) => String(i.name || "").trim());
  if (!items.length) throw new HttpError(400, "Add at least one product");
  for (const i of items) if (!(num(i.qty) > 0)) throw new HttpError(400, "Quantity must be greater than zero");
  return await tx(async (c) => {
    const cust = (await c.query("SELECT * FROM customers WHERE id=$1 AND active", [Number(b.customer_id)])).rows[0];
    if (!cust) throw new HttpError(400, "Select an active customer");
    const co = (await c.query("UPDATE company_settings SET next_challan=next_challan+1 WHERE id=1 RETURNING next_challan")).rows[0];
    const number = `DC-${String(co.next_challan - 1).padStart(4, "0")}`;
    const snap = { name: cust.name, mobile: cust.mobile, address: cust.address, city: cust.city, state: cust.state, pin: cust.pin, gstin: cust.gstin };
    const ch = (await c.query("INSERT INTO delivery_challans(number,customer_id,date,vehicle_no,transport,notes,customer_snapshot,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
      [number, cust.id, b.date, b.vehicle_no || null, b.transport || null, b.notes || null, JSON.stringify(snap), s.uid])).rows[0];
    for (const i of items) await c.query("INSERT INTO challan_items(challan_id,name,description,qty,unit) VALUES($1,$2,$3,$4,$5)", [ch.id, i.name.trim(), i.description || null, num(i.qty), i.unit || "Nos"]);
    return { id: ch.id, number };
  });
});
