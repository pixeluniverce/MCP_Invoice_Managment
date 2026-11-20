"use client";
import { useParams } from "next/navigation";
import { LedgerView } from "@/components/views";
export default function Ledger() { const { id } = useParams() as { id: string }; return <div className="space-y-3"><h1 className="text-xl font-bold">Customer Ledger</h1><LedgerView cid={Number(id)} /></div>; }
