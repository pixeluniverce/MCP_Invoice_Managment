import { q } from "@/lib/db";
import { route, num, qs } from "@/lib/api";
export const GET = route(["admin"], async (req) => {
  const p = qs(req); const a: any[] = [], w: string[] = [];
  if (p.get("status")) { a.push(p.get("status")); w.push(`m.status=$${a.length}`); }
  if (p.get("customer_id")) { a.push(Number(p.get("customer_id"))); w.push(`m.customer_id=$${a.length}`); }
  const size = Math.min(100, num(p.get("size"), 25)), off = (Math.max(1, num(p.get("page"), 1)) - 1) * size;
  const rows = await q(`SELECT m.*, c.name customer_name, u.username sent_by_name, COUNT(*) OVER() total_rows FROM whatsapp_messages m
    LEFT JOIN customers c ON c.id=m.customer_id LEFT JOIN users u ON u.id=m.sent_by ${w.length ? "WHERE " + w.join(" AND ") : ""} ORDER BY m.created_at DESC LIMIT ${size} OFFSET ${off}`, a);
  return { rows, total: rows[0]?.total_rows || 0 };
});
