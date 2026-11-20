"use client";
import { useParams } from "next/navigation";
import { InvoiceDetail } from "@/components/views";
export default function Bill() { const { id } = useParams() as { id: string }; return <InvoiceDetail id={id} />; }
