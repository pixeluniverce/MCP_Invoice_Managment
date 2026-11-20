import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getSession();
  if (!session) return <main className="min-h-screen grid place-items-center p-6"><section className="bg-white p-10 rounded-2xl shadow-sm max-w-lg w-full"><p className="text-sm font-semibold text-blue-700">MAHADEV CEMENT PRODUCT</p><h1 className="text-3xl font-bold mt-3">Business billing, simplified.</h1><p className="text-gray-600 mt-3">Sign in to manage invoices, customers, payments and account balances.</p><Link className="inline-block mt-6 bg-blue-700 text-white rounded-lg px-5 py-3" href="/login">Sign in</Link></section></main>;
  if (session.role === "CUSTOMER") return <main className="p-8"><h1 className="text-2xl font-bold">Customer portal</h1><p className="mt-2">Your account and invoices are available here.</p><Link href="/api/auth/logout" className="text-blue-700 underline">Sign out</Link></main>;
  const [customers, invoices, payments] = await Promise.all([
    prisma.customer.count(), prisma.invoice.aggregate({ _sum: { grandTotal: true }, _count: true }),
    prisma.payment.aggregate({ _sum: { amount: true } })
  ]);
  const outstanding = Number(invoices._sum.grandTotal ?? 0) - Number(payments._sum.amount ?? 0);
  return <main className="min-h-screen p-6 md:p-10"><header className="flex justify-between items-center"><div><p className="text-sm font-semibold text-blue-700">MAHADEV CEMENT PRODUCT</p><h1 className="text-3xl font-bold mt-1">Dashboard</h1></div><Link href="/api/auth/logout" className="text-sm text-blue-700 underline">Sign out</Link></header><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">{[
    ["Total customers", customers], ["Invoices", invoices._count], ["Total billed", `₹${Number(invoices._sum.grandTotal ?? 0).toLocaleString("en-IN")}`], ["Outstanding (estimate)", `₹${outstanding.toLocaleString("en-IN")}`]
  ].map(([label,value])=><article key={String(label)} className="bg-white rounded-xl p-6 border border-gray-200"><p className="text-gray-500 text-sm">{label}</p><p className="text-2xl font-bold mt-2">{value}</p></article>)}</div><section className="mt-8 bg-white rounded-xl p-6 border"><h2 className="font-semibold text-lg">Modules</h2><p className="text-gray-600 mt-2">This starter includes the database foundation and secure role-aware session layer. Implement remaining modules following the included master specification.</p><div className="flex flex-wrap gap-3 mt-4">{["Customers","Products","Invoices","Payments","Reports","Settings"].map(x=><span key={x} className="px-4 py-2 rounded-lg bg-gray-100 text-sm">{x}</span>)}</div></section></main>;
}