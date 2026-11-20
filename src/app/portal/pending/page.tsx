"use client";
import { useApi, Card, Stat, inr } from "@/components/ui";
import { InvoiceList } from "@/components/views";
export default function Pending() {
  const { data: s } = useApi<any>("/api/summary");
  return <div className="space-y-4"><h1 className="text-xl font-bold">Pending Bills</h1>{s && <Stat label="Total outstanding balance" value={inr(s.outstanding)} tone="red" />}<Card><InvoiceList mode="pending" base="/portal/bills" /></Card></div>;
}
