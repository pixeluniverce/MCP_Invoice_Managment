"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, useApi, useDebounce, State, Card, inr, today } from "@/components/ui";
import { calcInvoice } from "@/lib/calc";
import { MODES } from "@/components/views";

const blankItem = { name: "", description: "", hsn: "", qty: 1, unit: "Nos", rate: "", discount: 0, gst_rate: "" };

export default function NewInvoice() {
  const router = useRouter();
  const { data: st } = useApi<any>("/api/settings");
  const { data: prods } = useApi<any>("/api/products?active=1");
  const [cs, setCs] = useState(""), dcs = useDebounce(cs);
  const { data: custs } = useApi<any>(`/api/customers?size=20&search=${encodeURIComponent(dcs)}`);
  const [cust, setCust] = useState<any>(null);
  const [f, setF] = useState<any>({ date: today(), due_date: "", place_of_supply: "", gst_enabled: false, gst_type: "CGST_SGST", cgst: 9, sgst: 9, igst: 18, other_charges: 0, other_label: "", notes: "" });
  const [items, setItems] = useState<any[]>([{ ...blankItem }]);
  const [pay, setPay] = useState<any>({ amount: "", date: today(), mode: "Cash", reference: "" });
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false);

  useEffect(() => { if (st) setF((x: any) => ({ ...x, gst_enabled: !!st.gst_enabled, gst_type: st.gst_type || "CGST_SGST", cgst: st.cgst ?? 9, sgst: st.sgst ?? 9, igst: st.igst ?? 18 })); }, [st]);
  useEffect(() => { const id = sessionStorage.getItem("newInvoiceCustomer"); if (id) { sessionStorage.removeItem("newInvoiceCustomer"); api(`/api/customers/${id}`).then(pick).catch(() => {}); } }, []);
  function pick(c: any) { setCust(c); setF((x: any) => ({ ...x, place_of_supply: c.state || x.place_of_supply })); }
  const setI = (n: number, k: string, v: any) => setItems(items.map((it, i) => i === n ? { ...it, [k]: v } : it));
  function chooseProduct(n: number, id: string) {
    const p = prods?.rows.find((x: any) => String(x.id) === id); if (!p) return;
    setItems(items.map((it, i) => i === n ? { ...it, name: p.name, description: p.description || "", hsn: p.hsn || "", rate: p.rate, unit: p.unit, gst_rate: p.gst_rate ?? "" } : it));
  }
  const calc = useMemo(() => { try { return calcInvoice({ ...f, cgst: +f.cgst, sgst: +f.sgst, igst: +f.igst, other_charges: +f.other_charges || 0, items }); } catch { return null; } }, [f, items]);
  const paid = Math.max(0, Number(pay.amount) || 0), balance = calc ? calc.grand_total - paid : 0;

  async function submit(override = false) {
    if (!cust) return setErr("Select a customer"); setBusy(true); setErr("");
    try {
      const j = await api("/api/invoices", "POST", { ...f, customer_id: cust.id, items, override_tax_type: override, payment: paid > 0 ? pay : null });
      router.push(`/admin/invoices/${j.id}`);
    } catch (e: any) {
      if (e.code === "TAX_TYPE" && confirm(e.message)) return submit(true);
      setErr(e.message);
    } finally { setBusy(false); }
  }
  const F = (k: string, label: string, type = "text", extra: any = {}) => <div><label className="label">{label}</label><input className="input" type={type} value={f[k] ?? ""} onChange={e => setF({ ...f, [k]: e.target.value })} {...extra} /></div>;
  if (!st) return <State loading />;
  return (
    <div className="space-y-4 max-w-5xl">
      <h1 className="text-xl font-bold">New Invoice</h1>
      <Card title="Customer">
        {cust ? <div className="flex justify-between items-center"><div><div className="font-semibold">{cust.name}</div><div className="text-sm text-gray-500">{cust.mobile} · {[cust.city, cust.state].filter(Boolean).join(", ")} {cust.gstin && `· GSTIN ${cust.gstin}`}</div></div><button className="btn btn-sm" onClick={() => setCust(null)}>Change</button></div>
          : <div><input className="input" placeholder="Search customer by name or mobile" value={cs} onChange={e => setCs(e.target.value)} /><div className="mt-2 max-h-48 overflow-y-auto divide-y border rounded-lg">{(custs?.rows || []).filter((c: any) => c.active).map((c: any) => <button key={c.id} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onClick={() => pick(c)}>{c.name} <span className="text-gray-400">· {c.mobile}</span></button>)}</div></div>}
      </Card>
      <Card title="Invoice details"><div className="grid sm:grid-cols-3 gap-3">{F("date", "Invoice date", "date")}{F("due_date", "Due date", "date")}{F("place_of_supply", "Place of supply (state)")}</div></Card>
      <Card title="Products">
        <div className="space-y-3">{items.map((it, n) => (
          <div key={n} className="border rounded-xl p-3 space-y-2 bg-gray-50">
            <div className="grid sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2"><label className="label">Product</label><input className="input" list="plist" value={it.name} onChange={e => { setI(n, "name", e.target.value); const m = prods?.rows.find((p: any) => p.name === e.target.value); if (m) chooseProduct(n, String(m.id)); }} placeholder="Type or pick a saved product" /></div>
              <div><label className="label">HSN</label><input className="input" value={it.hsn} onChange={e => setI(n, "hsn", e.target.value)} /></div>
              <div><label className="label">Description</label><input className="input" value={it.description} onChange={e => setI(n, "description", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <div><label className="label">Qty</label><input className="input" type="number" step="any" value={it.qty} onChange={e => setI(n, "qty", e.target.value)} /></div>
              <div><label className="label">Unit</label><input className="input" value={it.unit} onChange={e => setI(n, "unit", e.target.value)} /></div>
              <div><label className="label">Rate</label><input className="input" type="number" step="any" value={it.rate} onChange={e => setI(n, "rate", e.target.value)} /></div>
              <div><label className="label">Discount ₹</label><input className="input" type="number" step="any" value={it.discount} onChange={e => setI(n, "discount", e.target.value)} /></div>
              {f.gst_enabled && <div><label className="label">GST % (optional override)</label><input className="input" type="number" step="any" value={it.gst_rate} onChange={e => setI(n, "gst_rate", e.target.value)} placeholder="default" /></div>}
              <div className="flex items-end justify-between"><div className="text-sm font-medium">{inr((Number(it.qty) || 0) * (Number(it.rate) || 0) - (Number(it.discount) || 0))}</div>{items.length > 1 && <button className="btn-danger btn-sm" onClick={() => setItems(items.filter((_, i) => i !== n))}>Remove</button>}</div>
            </div>
          </div>))}</div>
        <datalist id="plist">{(prods?.rows || []).map((p: any) => <option key={p.id} value={p.name} />)}</datalist>
        <button className="btn mt-3" onClick={() => setItems([...items, { ...blankItem }])}>+ Add row</button>
      </Card>
      <Card title="GST">
        <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={f.gst_enabled} onChange={e => setF({ ...f, gst_enabled: e.target.checked })} /> Enable GST</label>
        {f.gst_enabled && <div className="mt-3 space-y-3">
          <div className="flex gap-4 text-sm"><label className="flex items-center gap-1"><input type="radio" checked={f.gst_type === "CGST_SGST"} onChange={() => setF({ ...f, gst_type: "CGST_SGST" })} /> CGST + SGST</label><label className="flex items-center gap-1"><input type="radio" checked={f.gst_type === "IGST"} onChange={() => setF({ ...f, gst_type: "IGST" })} /> IGST</label></div>
          {f.gst_type === "CGST_SGST" ? <div className="grid grid-cols-2 gap-3 max-w-sm">{F("cgst", "CGST %", "number", { step: "any" })}{F("sgst", "SGST %", "number", { step: "any" })}</div> : <div className="max-w-[10rem]">{F("igst", "IGST %", "number", { step: "any" })}</div>}
          <p className="text-xs text-gray-500">Any percentage is allowed. Rates are saved on this invoice, so changing defaults later never alters old invoices.</p></div>}
      </Card>
      <Card title="Charges, notes & initial payment">
        <div className="grid sm:grid-cols-3 gap-3">{F("other_label", "Additional charge label (e.g. Transport)")}{F("other_charges", "Additional charges ₹", "number", { step: "any" })}{F("notes", "Notes")}</div>
        <div className="grid sm:grid-cols-4 gap-3 mt-3"><div><label className="label">Initial payment ₹</label><input className="input" type="number" step="any" value={pay.amount} onChange={e => setPay({ ...pay, amount: e.target.value })} /></div>
          <div><label className="label">Payment date</label><input className="input" type="date" value={pay.date} onChange={e => setPay({ ...pay, date: e.target.value })} /></div>
          <div><label className="label">Mode</label><select className="input" value={pay.mode} onChange={e => setPay({ ...pay, mode: e.target.value })}>{MODES.map(m => <option key={m}>{m}</option>)}</select></div>
          <div><label className="label">Reference no.</label><input className="input" value={pay.reference} onChange={e => setPay({ ...pay, reference: e.target.value })} /></div></div>
      </Card>
      <Card>
        {calc ? <div className="ml-auto max-w-xs text-sm space-y-1">
          <div className="flex justify-between"><span>Taxable amount</span><span>{inr(calc.taxable_total)}</span></div>
          {f.gst_enabled && calc.gst_type === "CGST_SGST" && <><div className="flex justify-between"><span>CGST</span><span>{inr(calc.cgst_total)}</span></div><div className="flex justify-between"><span>SGST</span><span>{inr(calc.sgst_total)}</span></div></>}
          {f.gst_enabled && calc.gst_type === "IGST" && <div className="flex justify-between"><span>IGST</span><span>{inr(calc.igst_total)}</span></div>}
          {calc.other_charges > 0 && <div className="flex justify-between"><span>{f.other_label || "Additional charges"}</span><span>{inr(calc.other_charges)}</span></div>}
          <div className="flex justify-between font-bold text-base border-t pt-1"><span>Grand total</span><span>{inr(calc.grand_total)}</span></div>
          {paid > 0 && <div className="flex justify-between text-green-600"><span>Paid now</span><span>{inr(paid)}</span></div>}
          <div className="flex justify-between font-semibold text-orange-600"><span>Balance</span><span>{inr(balance)}</span></div></div> : <div className="text-sm text-gray-400 text-right">Fill product name, quantity and rate to see totals</div>}
        {err && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-2 mt-3">{err}</div>}
        <div className="flex justify-end mt-3"><button className="btn-primary w-full sm:w-auto" disabled={busy} onClick={() => submit()}>{busy ? "Saving…" : "Save Invoice"}</button></div>
      </Card>
    </div>
  );
}
