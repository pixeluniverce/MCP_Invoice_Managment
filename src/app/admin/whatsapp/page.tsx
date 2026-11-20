"use client";
import { useState } from "react";
import { api, useApi, State, Card, Table, Badge, Pager, fdt } from "@/components/ui";
export default function WhatsApp() {
  const [page, setPage] = useState(1), [status, setStatus] = useState(""), { data, err, loading, reload } = useApi<any>(`/api/whatsapp/messages?page=${page}&status=${status}`);
  async function retry(id: number) { try { await api(`/api/whatsapp/retry/${id}`, "POST"); } catch (e: any) { alert(e.message); } reload(); }
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">WhatsApp Message History</h1>
      <Card>
        <div className="mb-3 w-48"><label className="label">Status</label><select className="input" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All</option>{["PENDING", "SENT", "DELIVERED", "READ", "FAILED"].map(s => <option key={s}>{s}</option>)}</select></div>
        <p className="text-xs text-gray-500 mb-2">“Sent” means WhatsApp accepted the message. Delivered / Read appear only after WhatsApp confirms them through the webhook.</p>
        <State loading={loading && !data} err={err} />
        <Table head={["Customer", "Mobile", "Type", "Reference", "Date & time", "Status", "Sent by", ""]} empty={!loading && !data?.rows.length}>{(data?.rows || []).map((m: any) => <tr key={m.id}><td className="td">{m.customer_name}</td><td className="td">{m.mobile}</td><td className="td capitalize">{m.type}</td><td className="td">{m.ref_label || "-"}</td><td className="td">{fdt(m.created_at)}</td>
          <td className="td"><Badge s={m.status} />{m.error && <div className="text-xs text-red-600 max-w-xs truncate whitespace-normal" title={m.error}>{m.error}</div>}</td><td className="td">{m.sent_by_name}</td><td className="td">{m.status === "FAILED" && <button className="btn btn-sm" onClick={() => retry(m.id)}>Retry</button>}</td></tr>)}</Table>
        <Pager page={page} total={data?.total || 0} onPage={setPage} /></Card>
    </div>
  );
}
