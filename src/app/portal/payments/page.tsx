"use client";
import { Card } from "@/components/ui";
import { PaymentList } from "@/components/views";
export default function Payments() { return <div className="space-y-4"><h1 className="text-xl font-bold">Payment History</h1><Card><PaymentList /></Card></div>; }
