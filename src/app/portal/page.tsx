"use client";
import Link from "next/link";
import { useApi, State, Card, Stat, Table, Badge, Money, inr, fdate } from "@/components/ui";

export default function PortalHome() {
  const { data: s, err, loading } = useApi<any>("/api/summary");
  const { data: recent } = useApi<any>("/api/invoices?size=5");
  const { data: pend } = useApi<any>("/api/invoices?status=PENDING&size=5");
  const { data: pays } = useApi<any>("/api/payments?size=5");
  if (!s) return <State loading={loading} err={err} />;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Welcome, {s.name}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Stat label="Total Purchase" value={inr(s.purchase)} tone="blue" /><Stat label="Total Paid" value={inr(s.paid)} tone="green" /><Stat label="Total Outstanding" value={inr(s.outstanding)} tone="red" /><Stat label="Total Bills" value={s.bills} /></div>
      <div className="flex flex-wrap gap-2"><Link className="btn-primary" href="/portal/bills">View All Bills</Link><Link className="btn" href="/portal/pending">View Pending Bills</Link><a className="btn" href="/api/pdf/statement/0">Download Statement</a><Link className="btn" href="/portal/payments">View Payment History</Link></div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Account summary"><dl className="text-sm space-y-2"><Line l="Total purchases" v={inr(s.purchase)} /><Line l="Total received" v={inr(s.paid)} /><Line l="Total pending" v={inr(s.outstanding)} /><Line l="Paid bills" v={s.paid_bills} /><Line l="Unpaid bills" v={s.unpaid_bills} /><Line l="Partially paid bills" v={s.partial_bills} /></dl></Card>
        <Card title="Pending payments" right={<Link className="text-sm text-blue-600" href="/portal/pending">All</Link>}>
          <Table head={["Invoice", "Due", "Pending"]} empty={!pend?.rows.length}>{(pend?.rows || []).map((r: any) => <tr key={r.id}><td className="td"><Link className="text-blue-600" href={`/portal/bills/${r.id}`}>{r.number}</Link></td><td className="td">{fdate(r.due_date)}</td><td className="td text-right"><Money v={r.pending} tone="red" /></td></tr>)}</Table></Card>
        <Card title="Recent bills" right={<Link className="text-sm text-blue-600" href="/portal/bills">All</Link>}>
          <Table head={["Invoice", "Date", "Total", "Status"]} empty={!recent?.rows.length}>{(recent?.rows || []).map((r: any) => <tr key={r.id}><td className="td"><Link className="text-blue-600" href={`/portal/bills/${r.id}`}>{r.number}</Link></td><td className="td">{fdate(r.date)}</td><td className="td text-right">{inr(r.grand_total)}</td><td className="td"><Badge s={r.pay_status} /></td></tr>)}</Table></Card>
        <Card title="Recent payments" right={<Link className="text-sm text-blue-600" href="/portal/payments">All</Link>}>
          <Table head={["Receipt", "Date", "Amount", ""]} empty={!pays?.rows.length}>{(pays?.rows || []).map((p: any) => <tr key={p.id}><td className="td">{p.receipt_no}</td><td className="td">{fdate(p.date)}</td><td className="td text-right"><Money v={p.amount} tone="green" /></td><td className="td"><a className="btn btn-sm" href={`/api/pdf/receipt/${p.id}`}>Receipt</a></td></tr>)}</Table></Card>
      </div>
    </div>
  );
}
const Line = ({ l, v }: { l: string; v: any }) => <div className="flex justify-between"><dt className="text-gray-500">{l}</dt><dd className="font-medium">{v}</dd></div>;
