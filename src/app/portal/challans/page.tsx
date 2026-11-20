"use client";
import { useState } from "react";
import { useApi, State, Card, Table, Pager, fdate } from "@/components/ui";
export default function Challans() {
  const [page, setPage] = useState(1), { data, err, loading } = useApi<any>(`/api/challans?page=${page}`);
  return <div className="space-y-4"><h1 className="text-xl font-bold">Delivery Challans</h1><Card><State loading={loading && !data} err={err} />
    <Table head={["Challan", "Date", "Items", "Vehicle", ""]} empty={!loading && !data?.rows.length}>{(data?.rows || []).map((c: any) => <tr key={c.id}><td className="td font-medium">{c.number}</td><td className="td">{fdate(c.date)}</td><td className="td max-w-xs truncate">{c.items}</td><td className="td">{c.vehicle_no || "-"}</td><td className="td"><a className="btn btn-sm" href={`/api/pdf/challan/${c.id}`}>PDF</a></td></tr>)}</Table>
    <Pager page={page} total={data?.total || 0} onPage={setPage} /></Card></div>;
}
