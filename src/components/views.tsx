"use client";
import { useState } from "react";
import Link from "next/link";
import { api, useApi, useDebounce, State, Card, Badge, Pager, Table, WaBtn, Money, sharePdf, inr, fdate, today } from "./ui";

const MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "Other"];
export { MODES };

// ---------- Invoice list (admin + customer portal). mode: all | pending | paid ----------
export function InvoiceList({ admin, cid, mode = "all", base, status0 }: { admin?: boolean; cid?: number; mode?: "all" | "pending" | "paid"; base: string; status0?: string }) {
  const [status, setStatus] = useState(mode === "pending" ? "PENDING" : mode === "paid" ? "PAID" : status0 || ""), [from, setFrom] = useState(""), [to, setTo] = useState(""), [search, setSearch] = useState(""), [page, setPage] = useState(1);
  const ds = useDebounce(search);
  const url = `/api/invoices?page=${page}&size=25&status=${status}&from=${from}&to=${to}${cid ? `&customer_id=${cid}` : ""}${admin ? `&search=${encodeURIComponent(ds)}` : ""}`;
  const { data, err, loading, reload } = useApi<any>(url);
  const rows = data?.rows || [];
  const head = mode === "paid" ? ["Invoice", "Date", "Amount", "Completed On", "Received", "Status", ""]
    : mode === "pending" ? ["Invoice", "Date", "Due", "Total", "Paid", "Pending", "Status", ""]
    : [...(admin ? ["Invoice", "Customer"] : ["Invoice"]), "Date", "Total", "Paid", "Pending", "Status", ""];
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3 items-end">
        {admin && <div className="w-full sm:w-56"><label className="label">Search</label><input className="input" placeholder="Invoice or customer" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>}
        {mode === "all" && <div><label className="label">Status</label><select className="input" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All</option><option value="PENDING">Pending (unpaid + partial)</option><option value="PAID">Paid</option><option value="UNPAID">Unpaid</option><option value="PARTIAL">Partially Paid</option></select></div>}
        <div><label className="label">From</label><input className="input" type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} /></div>
        <div><label className="label">To</label><input className="input" type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} /></div>
      </div>
      <State loading={loading && !data} err={err} />
      <Table head={head} empty={!loading && !rows.length}>
        {rows.map((r: any) => (
          <tr key={r.id} className="hover:bg-gray-50">
            <td className="td font-medium"><Link className="text-blue-600" href={`${base}/${r.id}`}>{r.number}</Link></td>
            {admin && mode === "all" && <td className="td"><Link className="hover:underline" href={`/admin/customers/${r.customer_id}`}>{r.customer_name}</Link></td>}
            <td className="td">{fdate(r.date)}</td>
            {mode === "pending" && <td className="td">{fdate(r.due_date)}</td>}
            <td className="td text-right"><Money v={r.grand_total} /></td>
            {mode === "paid" ? <><td className="td">{fdate(r.last_paid_date)}</td><td className="td text-right"><Money v={r.paid} tone="green" /></td></> : <><td className="td text-right"><Money v={r.paid} tone="green" /></td><td className="td text-right"><Money v={r.pending} tone="red" /></td></>}
            <td className="td"><Badge s={r.pay_status} /></td>
            <td className="td text-right space-x-1">
              <Link className="btn btn-sm" href={`${base}/${r.id}`}>View</Link>
              <a className="btn btn-sm" href={`/api/pdf/invoice/${r.id}`}>PDF</a>
              {admin && <><WaBtn type="invoice" id={r.id} label="" className="btn btn-sm" onDone={reload} />{r.pending > 0.004 && <Link className="btn btn-sm" href={`/admin/payments?customer_id=${r.customer_id}&invoice_id=${r.id}`}>Pay</Link>}</>}
            </td>
          </tr>
        ))}
      </Table>
      <Pager page={page} total={data?.total || 0} onPage={setPage} />
    </div>
  );
}

// ---------- Invoice detail ----------
export function InvoiceDetail({ id, admin }: { id: string; admin?: boolean }) {
  const { data, err, loading, reload } = useApi<any>(`/api/invoices/${id}`);
  if (loading || err) return <State loading={loading} err={err} />;
  const { invoice: i, items, payments, company: co } = data; const s = i.customer_snapshot || {};
  const gst = i.gst_enabled;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 print:hidden">
        <a className="btn-primary" href={`/api/pdf/invoice/${id}`}>Download PDF</a>
        <button className="btn" onClick={() => window.print()}>Print</button>
        <button className="btn" onClick={() => sharePdf(`/api/pdf/invoice/${id}`, `Invoice-${i.number}.pdf`)}>Share</button>
        {admin && <><WaBtn type="invoice" id={i.id} label="Send Invoice on WhatsApp" className="btn-green" onDone={reload} />
          {i.pending > 0.004 && <Link className="btn" href={`/admin/payments?customer_id=${i.customer_id}&invoice_id=${i.id}`}>Record Payment</Link>}</>}
      </div>
      <Card>
        <div className="flex flex-wrap justify-between gap-4">
          <div><div className="text-lg font-bold text-blue-700">{co.name}</div><div className="text-sm text-gray-600">{co.address}</div>{co.mobile && <div className="text-sm text-gray-600">Mob: {co.mobile}</div>}{co.gstin && <div className="text-sm text-gray-600">GSTIN: {co.gstin}</div>}</div>
          <div className="text-sm sm:text-right"><div className="text-lg font-bold">{gst ? "TAX INVOICE" : "INVOICE"}</div><div>No: <b>{i.number}</b></div><div>Date: {fdate(i.date)}</div>{i.due_date && <div>Due: {fdate(i.due_date)}</div>}{i.place_of_supply && <div>Place of supply: {i.place_of_supply}</div>}<div className="mt-1"><Badge s={i.pay_status} /></div></div>
        </div>
        <div className="mt-4 text-sm"><div className="text-xs text-gray-500">Bill to</div><div className="font-semibold">{s.name || i.customer_name}</div><div>{[s.address, s.city, s.state, s.pin].filter(Boolean).join(", ")}</div><div>{s.mobile || i.mobile}{s.gstin ? ` · GSTIN ${s.gstin}` : ""}</div></div>
      </Card>
      <Card title="Items">
        <Table head={["#", "Item", "Qty", "Rate", "Discount", "Taxable", ...(gst ? ["GST %", "Tax"] : []), "Total"]}>
          {items.map((x: any, n: number) => { const tax = x.cgst_amt + x.sgst_amt + x.igst_amt; return (
            <tr key={x.id}><td className="td">{n + 1}</td><td className="td">{x.name}{x.hsn && <span className="text-xs text-gray-400"> HSN {x.hsn}</span>}</td><td className="td">{x.qty} {x.unit}</td><td className="td text-right">{inr(x.rate)}</td><td className="td text-right">{inr(x.discount)}</td><td className="td text-right">{inr(x.taxable)}</td>
              {gst && <><td className="td">{x.cgst_rate + x.sgst_rate + x.igst_rate}%</td><td className="td text-right">{inr(tax)}</td></>}<td className="td text-right">{inr(x.taxable + tax)}</td></tr>); })}
        </Table>
        <div className="mt-4 ml-auto max-w-xs text-sm space-y-1">
          <Row l="Amount" v={i.subtotal} /><Row l="Discount" v={-i.discount_total} /><Row l="Taxable amount" v={i.taxable_total} />
          {gst && i.gst_type === "CGST_SGST" && <><Row l="CGST" v={i.cgst_total} /><Row l="SGST" v={i.sgst_total} /></>}{gst && i.gst_type === "IGST" && <Row l="IGST" v={i.igst_total} />}
          {i.other_charges > 0 && <Row l={i.other_label || "Additional charges"} v={i.other_charges} />}
          <div className="border-t pt-1"><Row l="Grand total" v={i.grand_total} b /></div><Row l="Amount paid" v={i.paid} tone="green" /><Row l="Pending" v={i.pending} tone="red" b />
        </div>
        {i.notes && <p className="text-sm text-gray-600 mt-3">Notes: {i.notes}</p>}
      </Card>
      <Card title="Payments against this invoice">
        <Table head={["Receipt", "Date", "Mode", "Reference", "Amount", ""]} empty={!payments.length}>
          {payments.map((p: any) => <tr key={p.payment_id}><td className="td">{p.receipt_no}</td><td className="td">{fdate(p.date)}</td><td className="td">{p.mode}</td><td className="td">{p.reference || "-"}</td><td className="td text-right"><Money v={p.amount} tone="green" /></td><td className="td"><a className="btn btn-sm" href={`/api/pdf/receipt/${p.payment_id}`}>Receipt</a></td></tr>)}
        </Table>
      </Card>
    </div>
  );
}
const Row = ({ l, v, b, tone }: { l: string; v: number; b?: boolean; tone?: "green" | "red" }) => <div className={`flex justify-between ${b ? "font-bold" : ""}`}><span>{l}</span><Money v={v} tone={tone} /></div>;

// ---------- Payments list ----------
export function PaymentList({ admin, cid, month }: { admin?: boolean; cid?: number; month?: string }) {
  const [page, setPage] = useState(1), [from, setFrom] = useState(""), [to, setTo] = useState("");
  const { data, err, loading, reload } = useApi<any>(`/api/payments?page=${page}&from=${from}&to=${to}${month ? `&month=${month}` : ""}${cid ? `&customer_id=${cid}` : ""}`);
  async function reverse(p: any) {
    const reason = prompt(`Reverse payment ${p.receipt_no} (${inr(p.amount)})?\nThe invoices it paid become pending again. Enter a reason:`); if (!reason) return;
    try { await api(`/api/payments/${p.id}/reverse`, "POST", { reason }); reload(); } catch (e: any) { alert(e.message); }
  }
  const rows = data?.rows || [];
  return (
    <div>
      <div className="flex gap-2 mb-3"><div><label className="label">From</label><input className="input" type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} /></div><div><label className="label">To</label><input className="input" type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} /></div></div>
      <State loading={loading && !data} err={err} />
      <Table head={["Receipt", "Date", ...(admin ? ["Customer"] : []), "Amount", "Mode", "Invoices", "Reference", ...(admin ? ["Status"] : []), ""]} empty={!loading && !rows.length}>
        {rows.map((p: any) => (
          <tr key={p.id} className={p.status === "REVERSED" ? "opacity-50" : ""}>
            <td className="td font-medium">{p.receipt_no}</td><td className="td">{fdate(p.date)}</td>{admin && <td className="td">{p.customer_name}</td>}
            <td className="td text-right"><Money v={p.amount} tone="green" /></td><td className="td">{p.mode}</td><td className="td">{p.invoices || <span className="text-gray-400">Advance</span>}</td><td className="td">{p.reference || "-"}</td>
            {admin && <td className="td"><Badge s={p.status} /></td>}
            <td className="td text-right space-x-1">{p.status === "ACTIVE" && <a className="btn btn-sm" href={`/api/pdf/receipt/${p.id}`}>Receipt</a>}
              {admin && p.status === "ACTIVE" && <><WaBtn type="receipt" id={p.id} label="Receipt" onDone={reload} /><button className="btn-danger btn-sm" onClick={() => reverse(p)}>Reverse</button></>}</td>
          </tr>))}
      </Table>
      <Pager page={page} total={data?.total || 0} onPage={setPage} />
    </div>
  );
}

// ---------- Ledger ----------
export function LedgerView({ cid }: { cid?: number }) {
  const [from, setFrom] = useState(""), [to, setTo] = useState("");
  const q = `${cid ? `customer_id=${cid}&` : ""}from=${from}&to=${to}`;
  const { data, err, loading } = useApi<any>(`/api/ledger?${q}`);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-end print:hidden">
        <div><label className="label">From</label><input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
        <div><label className="label">To</label><input className="input" type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
        <a className="btn-primary" href={`/api/pdf/statement/${cid || 0}?${q}`}>Download PDF</a>
        <a className="btn" href={`/api/ledger?${q}&format=csv`}>Download Excel (CSV)</a>
        <button className="btn" onClick={() => window.print()}>Print</button>
        {cid && <WaBtn type="statement" customerId={cid} label="Send Statement" className="btn-green" />}
      </div>
      <State loading={loading && !data} err={err} />
      {data && <Card title={data.customer.name}>
        <Table head={["Date", "Description", "Debit", "Credit", "Balance"]}>
          <tr className="bg-gray-50"><td className="td" /><td className="td font-medium">Opening Balance</td><td className="td" /><td className="td" /><td className="td text-right"><Money v={data.opening} /></td></tr>
          {data.rows.map((r: any, n: number) => <tr key={n}><td className="td">{fdate(r.date)}</td><td className="td">{r.description}</td><td className="td text-right">{r.debit ? inr(r.debit) : "-"}</td><td className="td text-right text-green-600">{r.credit ? inr(r.credit) : "-"}</td><td className="td text-right"><Money v={r.balance} tone="red" /></td></tr>)}
          <tr className="font-bold bg-gray-50"><td className="td" /><td className="td">Closing Balance</td><td className="td text-right">{inr(data.total_debit)}</td><td className="td text-right">{inr(data.total_credit)}</td><td className="td text-right">{inr(data.closing)}</td></tr>
        </Table>
      </Card>}
    </div>
  );
}

// ---------- Customers / Outstanding table ----------
export function CustomerTable({ outstanding }: { outstanding?: boolean }) {
  const [search, setSearch] = useState(""), [page, setPage] = useState(1), [sort, setSort] = useState(outstanding ? "outstanding_desc" : "");
  const ds = useDebounce(search);
  const { data, err, loading, reload } = useApi<any>(`/api/customers?page=${page}&search=${encodeURIComponent(ds)}&sort=${sort}${outstanding ? "&outstanding=1" : ""}`);
  const rows = data?.rows || [];
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3 items-end">
        <div className="w-full sm:w-64"><label className="label">Search</label><input className="input" placeholder="Name or mobile" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        {outstanding && <div><label className="label">Sort</label><select className="input" value={sort} onChange={e => setSort(e.target.value)}><option value="outstanding_desc">Highest outstanding</option><option value="outstanding_asc">Lowest outstanding</option><option value="oldest">Oldest pending</option><option value="newest">Newest pending</option></select></div>}
      </div>
      <State loading={loading && !data} err={err} />
      <Table head={outstanding ? ["Customer", "Mobile", "Purchase", "Paid", "Outstanding", "Pending Bills", "Last Payment", ""] : ["Customer", "Mobile", "Purchase", "Paid", "Outstanding", "Bills", "Login", ""]} empty={!loading && !rows.length}>
        {rows.map((c: any) => (
          <tr key={c.id} className="hover:bg-gray-50">
            <td className="td font-medium"><Link className="text-blue-600" href={`/admin/customers/${c.id}`}>{c.name}</Link>{!c.active && <span className="ml-1 text-xs text-gray-400">(inactive)</span>}</td>
            <td className="td">{c.mobile}</td><td className="td text-right">{inr(c.purchase)}</td><td className="td text-right"><Money v={c.paid} tone="green" /></td><td className="td text-right"><Money v={c.outstanding} tone="red" /></td>
            {outstanding ? <><td className="td">{c.pending_bills}</td><td className="td">{fdate(c.last_payment)}</td></> : <><td className="td">{c.bills}</td><td className="td">{c.login_id ? (c.login_active ? <Badge s="ACTIVE" /> : <Badge s="REVERSED" />) : <span className="text-gray-400">None</span>}</td></>}
            <td className="td text-right space-x-1">
              <Link className="btn btn-sm" href={`/admin/customers/${c.id}`}>View</Link>
              {outstanding && <><Link className="btn btn-sm" href={`/admin/payments?customer_id=${c.id}`}>Record Payment</Link><a className="btn btn-sm" href={`/api/pdf/outstanding/${c.id}`}>Statement</a><Link className="btn btn-sm" href={`/admin/customers/${c.id}/ledger`}>Ledger</Link></>}
              <WaBtn type={outstanding ? "reminder" : "statement"} customerId={c.id} label={outstanding ? "Reminder" : ""} onDone={reload} />
            </td>
          </tr>))}
      </Table>
      <Pager page={page} total={data?.total || 0} onPage={setPage} />
    </div>
  );
}

// ---------- Customer form (create + edit) ----------
export function CustomerForm({ initial, onSaved, onCancel }: { initial?: any; onSaved: (id?: number) => void; onCancel?: () => void }) {
  const [f, setF] = useState<any>(initial || { name: "", mobile: "", alt_mobile: "", address: "", city: "", state: "Gujarat", pin: "", gstin: "", opening_balance: 0, notes: "", whatsapp_optin: true, active: true, create_login: false, username: "", password: "" });
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  async function save() {
    setBusy(true); setErr("");
    try { const j = initial ? await api(`/api/customers/${initial.id}`, "PUT", f) : await api("/api/customers", "POST", f); onSaved(j.id); } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  const I = (k: string, label: string, type = "text") => <div><label className="label">{label}</label><input className="input" type={type} value={f[k] ?? ""} onChange={set(k)} /></div>;
  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {I("name", "Customer name *")}{I("mobile", "Mobile number *")}{I("alt_mobile", "Alternate number")}{I("address", "Address")}{I("city", "City")}{I("state", "State")}{I("pin", "PIN code")}{I("gstin", "GSTIN")}{I("opening_balance", "Opening balance (₹)", "number")}{I("notes", "Notes")}
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.whatsapp_optin} onChange={set("whatsapp_optin")} /> Customer has agreed to receive WhatsApp messages</label>
      {initial && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active !== false} onChange={set("active")} /> Customer active</label>}
      {!initial && <div className="rounded-lg bg-gray-50 p-3 space-y-2"><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={!!f.create_login} onChange={set("create_login")} /> Create Customer Login</label>
        {f.create_login && <div className="grid sm:grid-cols-2 gap-3">{I("username", "Username (blank = mobile number)")}{I("password", "Temporary password (8+ chars)")}</div>}</div>}
      {err && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{err}</div>}
      <div className="flex gap-2"><button className="btn-primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save customer"}</button>{onCancel && <button className="btn" onClick={onCancel}>Cancel</button>}</div>
    </div>
  );
}
export { today };
