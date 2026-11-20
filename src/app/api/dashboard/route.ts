import { q } from "@/lib/db";
import { route, qs, isDate } from "@/lib/api";
import { INV_WRAP, summarySql } from "@/lib/data";

function rangeFor(r: string, f: string | null, t: string | null): [string, string] {
  const now = new Date(Date.now() + 19800000), y = now.getUTCFullYear(), m = now.getUTCMonth(), d = now.getUTCDate();
  const D = (yy: number, mm: number, dd: number) => new Date(Date.UTC(yy, mm, dd)).toISOString().slice(0, 10);
  const dow = (now.getUTCDay() + 6) % 7;
  switch (r) {
    case "today": return [D(y, m, d), D(y, m, d)];
    case "yesterday": return [D(y, m, d - 1), D(y, m, d - 1)];
    case "week": return [D(y, m, d - dow), D(y, m, d - dow + 6)];
    case "lastmonth": return [D(y, m - 1, 1), D(y, m, 0)];
    case "year": return [D(y, 0, 1), D(y, 11, 31)];
    case "custom": if (isDate(f) && isDate(t)) return [f!, t!];
    default: return [D(y, m, 1), D(y, m + 1, 0)];
  }
}

export const GET = route(["admin"], async (req) => {
  const p = qs(req); const [from, to] = rangeFor(p.get("range") || "month", p.get("from"), p.get("to"));
  const [sales, rec, tot, month, counts, monthly, mix, top, recent] = await Promise.all([
    q(`SELECT COALESCE(SUM(grand_total),0) v, COUNT(*) n FROM invoices WHERE status='ACTIVE' AND date BETWEEN $1 AND $2`, [from, to]),
    q(`SELECT COALESCE(SUM(amount),0) v FROM payments WHERE status='ACTIVE' AND date BETWEEN $1 AND $2`, [from, to]),
    q(`SELECT (SELECT COALESCE(SUM(opening_balance),0) FROM customers)+(SELECT COALESCE(SUM(grand_total),0) FROM invoices WHERE status='ACTIVE')-(SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='ACTIVE') v, (SELECT COUNT(*) FROM customers) customers`),
    q(`SELECT COALESCE(SUM(amount),0) v FROM payments WHERE status='ACTIVE' AND to_char(date,'YYYY-MM')=to_char(now() AT TIME ZONE 'Asia/Kolkata','YYYY-MM')`),
    q(`SELECT COUNT(*) total, COUNT(*) FILTER (WHERE pay_status='PAID') paid, COUNT(*) FILTER (WHERE pay_status<>'PAID') pending FROM (${INV_WRAP}) t`),
    q(`SELECT to_char(date,'YYYY-MM') m, SUM(amount) v FROM payments WHERE status='ACTIVE' AND date >= (date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata')::date - interval '11 months') GROUP BY 1 ORDER BY 1`),
    q(`SELECT pay_status, COALESCE(SUM(grand_total),0) v, COUNT(*) n FROM (${INV_WRAP}) t GROUP BY pay_status`),
    q(`SELECT s.id,s.name,s.outstanding FROM (${summarySql(false)}) s WHERE s.outstanding>0.004 ORDER BY s.outstanding DESC LIMIT 8`),
    q(`SELECT * FROM (
        (SELECT 'invoice' kind, 'Invoice ' || number text, created_at at FROM invoices ORDER BY created_at DESC LIMIT 5)
        UNION ALL (SELECT 'customer', 'New customer ' || name, created_at FROM customers ORDER BY created_at DESC LIMIT 5)
        UNION ALL (SELECT 'payment', 'Payment ' || receipt_no || ' Rs ' || amount, created_at FROM payments ORDER BY created_at DESC LIMIT 5)
        UNION ALL (SELECT 'whatsapp', 'WhatsApp ' || type || ' to ' || mobile || ' (' || status || ')', created_at FROM whatsapp_messages ORDER BY created_at DESC LIMIT 5)
        UNION ALL (SELECT 'challan', 'Challan ' || number, created_at FROM delivery_challans ORDER BY created_at DESC LIMIT 5)) x ORDER BY at DESC LIMIT 15`),
  ]);
  return { from, to, sales: sales[0].v, sales_count: sales[0].n, received: rec[0].v, outstanding: tot[0].v, customers: tot[0].customers, received_month: month[0].v, invoices: counts[0], monthly, mix, top, recent };
});
