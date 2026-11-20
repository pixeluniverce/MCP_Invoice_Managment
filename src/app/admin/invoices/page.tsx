"use client";
import { Card } from "@/components/ui";
import { InvoiceList } from "@/components/views";
import Link from "next/link";
import { useQS } from "@/components/ui";
export default function Invoices() {
  const [p, ready] = useQS();
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold">All Invoices</h1><Link className="btn-primary" href="/admin/invoices/new">+ New Invoice</Link></div>
      <Card>{ready && <InvoiceList admin base="/admin/invoices" status0={p.get("status") || ""} />}</Card>
    </div>
  );
}
