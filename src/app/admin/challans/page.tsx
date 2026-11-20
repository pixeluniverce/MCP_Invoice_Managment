"use client";
import { useState } from "react";
import { api, useApi, useDebounce, State, Card, Table, Pager, WaBtn, fdate, today } from "@/components/ui";
const blank = { name: "", description: "", qty: 1, unit: "Nos" };
export default function Challans() {
  const [page, setPage] = useState(1), { data, err, loading, reload } = useApi<any>(`/api/challans?page=${page}`);
  const [open, setOpen] = useState(false), [cs, setCs] = useState(""), dcs = useDebounce(cs), { data: custs } = useApi<any>(open ? `/api/customers?size=20&search=${encodeURIComponent(dcs)}` : null);
  const [cust, setCust] = useState<any>(null), [f, setF] = useState<any>({ date: today(), vehicle_no: "", transport: "", notes: "" }), [items, setItems] = useState<any[]>([{ ...blank }]), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  const setI = (n: number, k: string, v: any) => setItems(items.map((it, i) => i === n ? { ...it, [k]: v } : it));
  async function save() {
    if (!cust) return setMsg("Select a customer"); setBusy(true); setMsg("");
    try { await api("/api/challans", "POST", { ...f, customer_id: cust.id, items }); setOpen(false); setCust(null); setItems([{ ...blank }]); reload(); } catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold">Delivery Challans</h1><button className="btn-primary" onClick={() => setOpen(!open)}>{open ? "Close" : "+ New Challan"}</button></div>
      {open && <Card title="New delivery challan (no GST)">
        {cust ? <div className="flex justify-between mb-3"><b>{cust.name}</b><button className="btn btn-sm" onClick={() => setCust(null)}>Change</button></div> : <div className="mb-3"><input className="input" placeholder="Search customer" value={cs} onChange={e => setCs(e.target.value)} /><div className="mt-2 max-h-40 overflow-y-auto divide-y border rounded-lg">{(custs?.rows || []).map((c: any) => <button key={c.id} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={() => setCust(c)}>{c.name} · {c.mobile}</button>)}</div></div>}
        <div className="grid sm:grid-cols-3 gap-3 mb-3"><div><label className="label">Date</label><input className="input" type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></div><div><label className="label">Vehicle number</label><input className="input" value={f.vehicle_no} onChange={e => setF({ ...f, vehicle_no: e.target.value })} /></div><div><label className="label">Transport details</label><input className="input" value={f.transport} onChange={e => setF({ ...f, transport: e.target.value })} /></div></div>
        {items.map((it, n) => <div key={n} className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2"><input className="input sm:col-span-2" placeholder="Product" value={it.name} onChange={e => setI(n, "name", e.target.value)} /><input className="input" placeholder="Description" value={it.description} onChange={e => setI(n, "description", e.target.value)} /><input className="input" type="number" step="any" placeholder="Qty" value={it.qty} onChange={e => setI(n, "qty", e.target.value)} /><div className="flex gap-1"><input className="input" placeholder="Unit" value={it.unit} onChange={e => setI(n, "unit", e.target.value)} />{items.length > 1 && <button className="btn-danger btn-sm" onClick={() => setItems(items.filter((_, i) => i !== n))}>✕</button>}</div></div>)}
        <button className="btn btn-sm" onClick={() => setItems([...items, { ...blank }])}>+ Add row</button>
        <div className="mt-3"><label className="label">Notes</label><input className="input" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></div>
        {msg && <div className="text-sm text-red-600 mt-2">{msg}</div>}<button className="btn-primary mt-3" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save challan"}</button></Card>}
      <Card><State loading={loading && !data} err={err} />
        <Table head={["Challan", "Date", "Customer", "Items", "Vehicle", ""]} empty={!loading && !data?.rows.length}>{(data?.rows || []).map((c: any) => <tr key={c.id}><td className="td font-medium">{c.number}</td><td className="td">{fdate(c.date)}</td><td className="td">{c.customer_name}</td><td className="td max-w-xs truncate">{c.items}</td><td className="td">{c.vehicle_no || "-"}</td>
          <td className="td space-x-1 text-right"><a className="btn btn-sm" href={`/api/pdf/challan/${c.id}?inline=1`} target="_blank">Preview</a><a className="btn btn-sm" href={`/api/pdf/challan/${c.id}`}>PDF</a><WaBtn type="challan" id={c.id} label="" onDone={reload} /></td></tr>)}</Table>
        <Pager page={page} total={data?.total || 0} onPage={setPage} /></Card>
    </div>
  );
}
