"use client";
import { useState } from "react";
import Link from "next/link";
import { useApi, State, Card, Stat, inr, fdt, fdate } from "@/components/ui";

const RANGES = [["today", "Today"], ["yesterday", "Yesterday"], ["week", "This Week"], ["month", "This Month"], ["lastmonth", "Last Month"], ["year", "This Year"], ["custom", "Custom"]];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function last12() { const out: string[] = []; const n = new Date(Date.now() + 19800000); for (let i = 11; i >= 0; i--) { const d = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth() - i, 1)); out.push(d.toISOString().slice(0, 7)); } return out; }

export default function Dashboard() {
  const [r, setR] = useState("month"), [f, setF] = useState(""), [t, setT] = useState("");
  const { data: d, err, loading } = useApi<any>(`/api/dashboard?range=${r}${r === "custom" && f && t ? `&from=${f}&to=${t}` : ""}`);
  if (!d) return <State loading={loading} err={err} />;
  const months = last12(), mv: any = Object.fromEntries(d.monthly.map((x: any) => [x.m, x.v])), maxM = Math.max(1, ...months.map(m => mv[m] || 0));
  const mix: any = Object.fromEntries(d.mix.map((x: any) => [x.pay_status, x])), mixTotal = Math.max(1, d.mix.reduce((a: number, x: any) => a + x.v, 0));
  const sbars = [["Total Sales", d.sales, "bg-blue-500"], ["Total Received", d.received, "bg-green-500"], ["Total Outstanding", d.outstanding, "bg-orange-500"]] as const, maxS = Math.max(1, ...sbars.map(b => Math.abs(b[1] as number)));
  const maxO = Math.max(1, ...d.top.map((x: any) => x.outstanding));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-end">
        {RANGES.map(([k, l]) => <button key={k} className={r === k ? "btn-primary btn-sm" : "btn btn-sm"} onClick={() => setR(k)}>{l}</button>)}
        {r === "custom" && <><input className="input !w-auto" type="date" value={f} onChange={e => setF(e.target.value)} /><input className="input !w-auto" type="date" value={t} onChange={e => setT(e.target.value)} /></>}
        <span className="text-xs text-gray-500 ml-auto">{fdate(d.from)} – {fdate(d.to)}</span>
      </div>
      <State err={err} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total Sales (period)" value={inr(d.sales)} tone="blue" /><Stat label="Total Received (period)" value={inr(d.received)} tone="green" />
        <Stat label="Total Outstanding" value={inr(d.outstanding)} tone="red" href="/admin/outstanding" /><Stat label="Received This Month" value={inr(d.received_month)} tone="green" />
        <Stat label="Total Customers" value={d.customers} href="/admin/customers" /><Stat label="Total Invoices" value={d.invoices.total} href="/admin/invoices" />
        <Stat label="Paid Invoices" value={d.invoices.paid} tone="green" href="/admin/invoices?status=PAID" /><Stat label="Pending Invoices" value={d.invoices.pending} tone="red" href="/admin/invoices?status=PENDING" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Monthly collection (click a month)">
          <div className="flex items-end gap-1 h-44">{months.map(m => { const v = mv[m] || 0; return (
            <Link key={m} href={`/admin/payments?month=${m}`} className="flex-1 flex flex-col items-center justify-end h-full group" title={`${m}: ${inr(v)}`}>
              <div className="text-[9px] text-gray-500 opacity-0 group-hover:opacity-100">{v ? Math.round(v / 1000) + "k" : ""}</div>
              <div className="w-full bg-green-500 group-hover:bg-green-600 rounded-t transition-all" style={{ height: `${Math.max(2, (v / maxM) * 100)}%` }} />
              <div className="text-[10px] text-gray-500 mt-1">{MONTHS[+m.slice(5) - 1]}</div></Link>); })}</div>
        </Card>
        <Card title="Sales, received & outstanding">
          <div className="space-y-4 pt-2">{sbars.map(([l, v, c]) => <div key={l}><div className="flex justify-between text-sm mb-1"><span>{l}</span><b>{inr(v)}</b></div><div className="h-3 bg-gray-100 rounded-full"><div className={`h-3 rounded-full ${c} transition-all`} style={{ width: `${(Math.abs(v as number) / maxS) * 100}%` }} /></div></div>)}</div>
        </Card>
        <Card title="Customers with outstanding (click to open)" right={<Link className="text-sm text-blue-600" href="/admin/outstanding">View all</Link>}>
          {!d.top.length && <div className="text-sm text-gray-400">No outstanding balances 🎉</div>}
          <div className="space-y-2">{d.top.map((c: any) => <Link key={c.id} href={`/admin/customers/${c.id}`} className="block"><div className="flex justify-between text-sm"><span className="truncate">{c.name}</span><b className="text-orange-600">{inr(c.outstanding)}</b></div><div className="h-2 bg-gray-100 rounded-full"><div className="h-2 rounded-full bg-orange-500" style={{ width: `${(c.outstanding / maxO) * 100}%` }} /></div></Link>)}</div>
        </Card>
        <Card title="Paid vs partially paid vs unpaid (click a section)">
          <div className="flex h-6 rounded-full overflow-hidden bg-gray-100">{([["PAID", "bg-green-500"], ["PARTIAL", "bg-orange-400"], ["UNPAID", "bg-red-500"]] as const).map(([k, c]) => mix[k] ? <Link key={k} href={`/admin/invoices?status=${k}`} className={c} style={{ width: `${(mix[k].v / mixTotal) * 100}%` }} title={k} /> : null)}</div>
          <div className="mt-3 space-y-1 text-sm">{([["PAID", "Paid", "bg-green-500"], ["PARTIAL", "Partially paid", "bg-orange-400"], ["UNPAID", "Unpaid", "bg-red-500"]] as const).map(([k, l, c]) => <Link key={k} href={`/admin/invoices?status=${k}`} className="flex items-center gap-2 hover:underline"><span className={`w-3 h-3 rounded-full ${c}`} />{l}: {inr(mix[k]?.v || 0)} ({mix[k]?.n || 0} invoices)</Link>)}</div>
        </Card>
      </div>
      <Card title="Recent activity">
        <ul className="divide-y text-sm">{d.recent.map((a: any, i: number) => <li key={i} className="py-2 flex justify-between gap-2"><span>{({ invoice: "🧾", customer: "👤", payment: "💰", whatsapp: "💬", challan: "🚚" } as any)[a.kind]} {a.text}</span><span className="text-gray-400 whitespace-nowrap">{fdt(a.at)}</span></li>)}</ul>
      </Card>
    </div>
  );
}
