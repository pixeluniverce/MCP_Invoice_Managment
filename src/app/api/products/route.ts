import { q } from "@/lib/db";
import { route, body, need, num, qs, log } from "@/lib/api";

export const GET = route(["admin"], async (req) => {
  const p = qs(req); const w: string[] = [], a: any[] = [];
  if (p.get("active") === "1") w.push("active");
  if (p.get("search")) { a.push(`%${p.get("search")}%`); w.push(`(name ILIKE $${a.length} OR hsn ILIKE $${a.length})`); }
  return { rows: await q(`SELECT * FROM products ${w.length ? "WHERE " + w.join(" AND ") : ""} ORDER BY lower(name) LIMIT 500`, a) };
});
export const POST = route(["admin"], async (req, { s }) => {
  const b = await body(req); need(String(b.name || "").trim(), "Product name is required");
  const r = await q("INSERT INTO products(name,description,hsn,rate,unit,gst_rate) VALUES($1,$2,$3,$4,$5,$6) RETURNING id",
    [b.name.trim(), b.description || null, b.hsn || null, num(b.rate), b.unit || "Nos", b.gst_rate === "" || b.gst_rate == null ? null : num(b.gst_rate)]);
  await log(s.uid, "PRODUCT_CREATED", String(r[0].id)); return { id: r[0].id };
});
