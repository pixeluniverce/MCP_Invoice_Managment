"use client";
import { Card } from "@/components/ui";
import { InvoiceList } from "@/components/views";
export default function Paid() { return <div className="space-y-4"><h1 className="text-xl font-bold">Paid Bills</h1><Card><InvoiceList mode="paid" base="/portal/bills" /></Card></div>; }
