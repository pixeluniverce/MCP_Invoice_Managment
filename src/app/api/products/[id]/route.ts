import { q } from "@/lib/db";
import { route, body, need, num, HttpError, log } from "@/lib/api";
export const PUT = route(["admin"], async (req, { s, params }) => {
  const b = await body(req); need(String(b.name || "").trim(), "Product name is required");
  const r = await q("UPDATE products SET name=$1,description=$2,hsn=$3,rate=$4,unit=$5,gst_rate=$6,active=$7 WHERE id=$8 RETURNING id",
    [b.name.trim(), b.description || null, b.hsn || null, num(b.rate), b.unit || "Nos", b.gst_rate === "" || b.gst_rate == null ? null : num(b.gst_rate), b.active !== false, Number(params.id)]);
  if (!r.length) throw new HttpError(404, "Product not found");
  await log(s.uid, "PRODUCT_UPDATED", String(params.id)); return { ok: true };
});
