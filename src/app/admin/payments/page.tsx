"use client";
import { useEffect, useState } from "react";
import { api, useApi, useDebounce, useQS, State, Card, inr, fdate, today, WaBtn } from "@/components/ui";
import { PaymentList, MODES } from "@/components/views";

export default function Payments() {
  const [qp, ready] = useQS();
  const [open, setOpen] = useState(false), [cs, setCs] = useState(""), dcs = useDebounce(cs), [cust, setCust] = useState<any>(null), [k, setK] = useState(0);
  const { data: custs } = useApi<any>(open && !cust ? `/api/customers?size=20&search=${encodeURIComponent(dcs)}` : null);
  const { data: pend } = useApi<any>(cust ? `/api/invoices?customer_id=${cust.id}&status=PENDING&size=100&r=${k}` : null);
  const [f, setF] = useState<any>({ amount: "", date: today(), mode: "Cash", reference: "", notes: "" }), [auto, setAuto] = useState(true), [alloc, setAlloc] = useState<any>({}), [err, setErr] = useState(""), [busy, setBusy] = useState(false), [done, setDone] = useState<any>(null);
  useEffect(() => { const c = qp.get("customer_id"); if (ready && c) { setOpen(true); api(`/api/customers/${c}`).then(setCust).catch(() => {}); } }, [ready]);
  useEffect(() => { const inv = qp.get("invoice_id"); if (inv && pend) { const r = pend.rows.find((x: any) => String(x.id) === inv); if (r) { setAuto(false); setAlloc({ [r.id]: r.pending }); setF((x: any) => ({ ...x, amount: r.pending })); } } }, [pend]);
  const allocTotal = Object.values(alloc).reduce((a: number, v: any) => a + (Number(v) || 0), 0);
  async function save() {
    setBusy(true); setErr("");
    try {
      const allocations = auto ? undefined : Object.entries(alloc).filter(([, v]) => Number(v) > 0).map(([id, amount]) => ({ invoice_id: Number(id), amount }));
      const j = await api("/api/payments", "POST", { ...f, customer_id: cust.id, auto, allocations });
      setDone(j); setF({ ...f, amount: "", reference: "", notes: "" }); setAlloc({}); setK(k + 1);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold">Payments</h1><button className="btn-primary" onClick={() => { setOpen(!open); setDone(null); }}>{open ? "Close" : "+ Record Payment"}</button></div>
      {open && <Card title="Record payment">
        {!cust ? <div><input className="input" placeholder="Search customer" value={cs} onChange={e => setCs(e.target.value)} /><div className="mt-2 max-h-48 overflow-y-auto divide-y border rounded-lg">{(custs?.rows || []).map((c: any) => <button key={c.id} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={() => setCust(c)}>{c.name} <span className="text-gray-400">· {c.mobile} · outstanding {inr(c.outstanding)}</span></button>)}</div></div> :
        <div className="space-y-3">
          <div className="flex justify-between"><div className="font-semibold">{cust.name} <span className="text-sm font-normal text-gray-500">outstanding {inr(cust.outstanding)}</span></div><button className="btn btn-sm" onClick={() => { setCust(null); setDone(null); }}>Change</button></div>
          <div className="grid sm:grid-cols-4 gap-3">
            <div><label className="label">Amount ₹</label><input className="input" type="number" step="any" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /></div>
            <div><label className="label">Date</label><input className="input" type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></div>
            <div><label className="label">Mode</label><select className="input" value={f.mode} onChange={e => setF({ ...f, mode: e.target.value })}>{MODES.map(m => <option key={m}>{m}</option>)}</select></div>
            <div><label className="label">Reference no.</label><input className="input" value={f.reference} onChange={e => setF({ ...f, reference: e.target.value })} /></div></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} /> Auto-allocate to oldest pending invoices first (any extra is saved as advance)</label>
          {!auto && <div className="border rounded-xl divide-y">{(pend?.rows || []).map((r: any) => <div key={r.id} className="flex items-center justify-between gap-2 p-2 text-sm"><div><b>{r.number}</b> · {fdate(r.date)}<div className="text-xs text-gray-500">Pending {inr(r.pending)}</div></div><input className="input !w-32" type="number" step="any" placeholder="0" value={alloc[r.id] ?? ""} onChange={e => setAlloc({ ...alloc, [r.id]: e.target.value })} /></div>)}
            {!pend?.rows.length && <div className="p-3 text-sm text-gray-400">No pending invoices – the full amount will be saved as advance.</div>}
            <div className="p-2 text-sm text-right">Allocated {inr(allocTotal)} of {inr(f.amount || 0)}</div></div>}
          {err && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{err}</div>}
          {done && <div className="text-sm bg-green-50 text-green-700 rounded-lg p-3 flex flex-wrap items-center gap-2">Saved receipt <b>{done.receipt_no}</b>{done.advance > 0 && ` (advance ${inr(done.advance)})`}<a className="btn btn-sm" href={`/api/pdf/receipt/${done.id}`}>Receipt PDF</a><WaBtn type="receipt" id={done.id} label="Send Receipt on WhatsApp" /></div>}
          <button className="btn-primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save payment"}</button>
        </div>}
      </Card>}
      <Card>{ready && <PaymentList key={k} admin month={qp.get("month") || undefined} />}</Card>
    </div>
  );
}
