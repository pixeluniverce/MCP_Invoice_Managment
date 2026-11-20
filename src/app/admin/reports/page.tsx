"use client";
import { useState } from "react";
import { useApi, State, Card, Table, fdate } from "@/components/ui";
const REPORTS = [["daily-sales", "Daily Sales"], ["monthly-sales", "Monthly Sales"], ["yearly-sales", "Yearly Sales"], ["daily-collection", "Daily Collection"], ["monthly-collection", "Monthly Collection"], ["customer-outstanding", "Customer-wise Outstanding"], ["invoice-payment", "Invoice-wise Payment"], ["paid-vs-unpaid", "Paid vs Unpaid"], ["product-sales", "Product-wise Sales"], ["gst-summary", "GST Summary"], ["challans", "Delivery Challans"], ["whatsapp", "WhatsApp Messages"]];
const fmt = (k: string, v: any) => v == null ? "-" : /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? fdate(v) : typeof v === "number" && !/(invoices|payments|quantity|pending_bills|gst_percent)/.test(k) ? v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(v);
export default function Reports() {
  const [name, setName] = useState("monthly-sales"), [from, setFrom] = useState(""), [to, setTo] = useState("");
  const q = `from=${from}&to=${to}`, { data, err, loading } = useApi<any>(`/api/reports/${name}?${q}`);
  const rows = data?.rows || [], cols = rows[0] ? Object.keys(rows[0]) : [];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold print:hidden">Reports</h1>
      <Card className="print:shadow-none print:border-0">
        <div className="flex flex-wrap gap-2 items-end mb-3 print:hidden">
          <div><label className="label">Report</label><select className="input" value={name} onChange={e => setName(e.target.value)}>{REPORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
          <div><label className="label">From</label><input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
          <div><label className="label">To</label><input className="input" type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
          <a className="btn" href={`/api/reports/${name}?${q}&format=csv`}>CSV / Excel</a><button className="btn" onClick={() => window.print()}>Print / Save as PDF</button>
        </div>
        <h2 className="font-semibold mb-2 hidden print:block">{REPORTS.find(r => r[0] === name)?.[1]} {from && `from ${fdate(from)}`} {to && `to ${fdate(to)}`}</h2>
        <State loading={loading && !data} err={err} />
        <Table head={cols.map(c => c.replace(/_/g, " "))} empty={!loading && !rows.length}>{rows.map((r: any, i: number) => <tr key={i}>{cols.map(c => <td key={c} className="td">{fmt(c, c === "created_at" && r[c] ? new Date(r[c]).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : r[c])}</td>)}</tr>)}</Table>
      </Card>
    </div>
  );
}
