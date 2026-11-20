"use client";
import { Card } from "@/components/ui";
import { CustomerTable } from "@/components/views";
export default function Outstanding() { return <div className="space-y-4"><h1 className="text-xl font-bold">Outstanding</h1><Card><CustomerTable outstanding /></Card></div>; }
