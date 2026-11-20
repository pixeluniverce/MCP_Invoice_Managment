"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { CustomerTable, CustomerForm } from "@/components/views";
export default function Customers() {
  const [adding, setAdding] = useState(false), [k, setK] = useState(0), router = useRouter();
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold">Customers</h1><button className="btn-primary" onClick={() => setAdding(!adding)}>{adding ? "Close" : "+ Add Customer"}</button></div>
      {adding && <Card title="New customer"><CustomerForm onSaved={id => { setAdding(false); setK(k + 1); router.push(`/admin/customers/${id}`); }} onCancel={() => setAdding(false)} /></Card>}
      <Card><CustomerTable key={k} /></Card>
    </div>
  );
}
