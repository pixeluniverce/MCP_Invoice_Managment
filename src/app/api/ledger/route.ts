import { route, qs, isDate, HttpError, json } from "@/lib/api";
import { getLedger } from "@/lib/data";
export const GET = route(["admin", "customer"], async (req, { s }) => {
  const p = qs(req);
  const cid = s.role === "customer" ? s.customerId : Number(p.get("customer_id"));
  if (!cid) throw new HttpError(400, "customer_id required");
  const led = await getLedger(cid, isDate(p.get("from")) ? p.get("from")! : undefined, isDate(p.get("to")) ? p.get("to")! : undefined);
  if (p.get("format") === "csv") {
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [["Date", "Description", "Debit", "Credit", "Balance"], ["", "Opening Balance", "", "", led.opening], ...led.rows.map((r: any) => [r.date, r.description, r.debit, r.credit, r.balance])];
    return new Response(lines.map(l => l.map(esc).join(",")).join("\n"), { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="ledger-${cid}.csv"` } });
  }
  return led;
});
