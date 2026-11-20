"use client";
import { Card } from "@/components/ui";
import { InvoiceList } from "@/components/views";
export default function Bills() { return <div className="space-y-4"><h1 className="text-xl font-bold">All Bills</h1><Card><InvoiceList base="/portal/bills" /></Card></div>; }
