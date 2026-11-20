"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, useApi, State, Card, Stat, Badge, WaBtn, inr, fdt, fdate } from "@/components/ui";
import { CustomerForm, InvoiceList, PaymentList } from "@/components/views";

export default function CustomerPage() {
  const { id } = useParams() as { id: string };
  const { data: c, err, loading, reload } = useApi<any>(`/api/customers/${id}`);
  const [edit, setEdit] = useState(false), [pw, setPw] = useState(""), [user, setUser] = useState(""), [msg, setMsg] = useState("");
  if (!c) return <State loading={loading} err={err} />;
  async function login(action: string) {
    setMsg("");
    try { await api(`/api/customers/${id}/login`, "POST", { action, password: pw, username: user }); setPw(""); setMsg("Done"); reload(); } catch (e: any) { setMsg(e.message); }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div><h1 className="text-xl font-bold">{c.name}</h1><div className="text-sm text-gray-500">{c.mobile} · {[c.city, c.state].filter(Boolean).join(", ")}{c.gstin ? ` · GSTIN ${c.gstin}` : ""}</div></div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn-primary" href="/admin/invoices/new" onClick={() => sessionStorage.setItem("newInvoiceCustomer", id)}>New Invoice</Link>
          <Link className="btn" href={`/admin/payments?customer_id=${id}`}>Record Payment</Link>
          <Link className="btn" href={`/admin/customers/${id}/ledger`}>Ledger</Link>
          <WaBtn type="statement" customerId={Number(id)} label="Send Account Statement" className="btn" />
          <WaBtn type="reminder" customerId={Number(id)} label="Send Payment Reminder" className="btn" onDone={reload} />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Stat label="Total Purchase" value={inr(c.purchase)} tone="blue" /><Stat label="Total Paid" value={inr(c.paid)} tone="green" /><Stat label="Total Outstanding" value={inr(c.outstanding)} tone="red" /><Stat label="Total Bills" value={c.bills} /></div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Customer details" right={<button className="btn btn-sm" onClick={() => setEdit(!edit)}>{edit ? "Close" : "Edit"}</button>}>
          {edit ? <CustomerForm initial={c} onSaved={() => { setEdit(false); reload(); }} onCancel={() => setEdit(false)} /> :
            <dl className="text-sm grid grid-cols-3 gap-y-2"><dt className="text-gray-500">Address</dt><dd className="col-span-2">{[c.address, c.city, c.state, c.pin].filter(Boolean).join(", ") || "-"}</dd><dt className="text-gray-500">Alt. number</dt><dd className="col-span-2">{c.alt_mobile || "-"}</dd>
              <dt className="text-gray-500">Opening balance</dt><dd className="col-span-2">{inr(c.opening_balance)}</dd><dt className="text-gray-500">WhatsApp opt-in</dt><dd className="col-span-2">{c.whatsapp_optin ? "Yes" : "No"}</dd><dt className="text-gray-500">Status</dt><dd className="col-span-2">{c.active ? "Active" : "Inactive"}</dd><dt className="text-gray-500">Notes</dt><dd className="col-span-2">{c.notes || "-"}</dd></dl>}
        </Card>
        <Card title="Customer portal login">
          {c.login_id ? <div className="space-y-3 text-sm">
            <div>Username: <b>{c.username}</b> · {c.login_active ? <Badge s="ACTIVE" /> : <Badge s="REVERSED" />} · Last login: {fdt(c.last_login)}</div>
            <div className="flex flex-wrap gap-2 items-end"><div><label className="label">New temporary password</label><input className="input" value={pw} onChange={e => setPw(e.target.value)} placeholder="8+ characters" /></div><button className="btn" onClick={() => login("reset")}>Reset password</button>
              {c.login_active ? <button className="btn-danger" onClick={() => login("disable")}>Disable login</button> : <button className="btn-green" onClick={() => login("enable")}>Reactivate login</button>}</div>
          </div> : <div className="space-y-3 text-sm"><div className="text-gray-500">No login yet. Customer can sign in with username or mobile number.</div>
            <div className="grid sm:grid-cols-2 gap-2"><div><label className="label">Username (blank = mobile)</label><input className="input" value={user} onChange={e => setUser(e.target.value)} /></div><div><label className="label">Temporary password</label><input className="input" value={pw} onChange={e => setPw(e.target.value)} placeholder="8+ characters" /></div></div>
            <button className="btn-primary" onClick={() => login("create")}>Create Customer Login</button></div>}
          {msg && <div className="text-sm mt-2 text-blue-700">{msg}</div>}
        </Card>
      </div>
      <Card title="Invoices"><InvoiceList admin cid={Number(id)} base="/admin/invoices" /></Card>
      <Card title="Payments"><PaymentList admin cid={Number(id)} /></Card>
    </div>
  );
}
