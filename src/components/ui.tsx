"use client";
import { useEffect, useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { inr } from "@/lib/fmt";
export { inr, fdate, fdt, today } from "@/lib/fmt";

export async function api(url: string, method = "GET", data?: any) {
  const r = await fetch(url, { method, headers: data ? { "Content-Type": "application/json" } : undefined, body: data ? JSON.stringify(data) : undefined });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401) { window.location.href = "/login"; throw new Error("Please log in"); }
  if (!r.ok) { const e: any = new Error(j.error || "Something went wrong"); e.code = j.code; e.data = j; throw e; }
  return j;
}

export function useApi<T = any>(url: string | null) {
  const [data, setData] = useState<T | null>(null), [err, setErr] = useState(""), [loading, setLoading] = useState(true), [n, setN] = useState(0);
  useEffect(() => {
    if (!url) return; let live = true; setLoading(true);
    api(url).then(j => { if (live) { setData(j); setErr(""); } }).catch(e => live && setErr(e.message)).finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [url, n]);
  return { data, err, loading, reload: () => setN(x => x + 1) };
}
export function useDebounce<T>(v: T, ms = 350) { const [d, setD] = useState(v); useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]); return d; }
export function useQS(): [URLSearchParams, boolean] {
  const [p, setP] = useState(new URLSearchParams()), [ready, setReady] = useState(false);
  useEffect(() => { setP(new URLSearchParams(window.location.search)); setReady(true); }, []);
  return [p, ready];
}

export function State({ loading, err }: { loading?: boolean; err?: string }) {
  if (err) return <div className="rounded-lg bg-red-50 text-red-700 text-sm p-3 my-2">{err}</div>;
  if (loading) return <div className="py-6 text-center text-sm text-gray-400 animate-pulse">Loading…</div>;
  return null;
}
export function Card({ title, right, children, className = "" }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{(title || right) && <div className="flex items-center justify-between gap-2 mb-3"><h2 className="font-semibold">{title}</h2>{right}</div>}{children}</div>;
}
export function Stat({ label, value, tone, href }: { label: string; value: ReactNode; tone?: "green" | "red" | "blue"; href?: string }) {
  const c = tone === "green" ? "text-green-600" : tone === "red" ? "text-orange-600" : tone === "blue" ? "text-blue-600" : "text-gray-900";
  const inner = <div className="card hover:shadow-md transition"><div className="text-xs text-gray-500">{label}</div><div className={`text-xl md:text-2xl font-bold mt-1 ${c}`}>{value}</div></div>;
  return href ? <Link href={href}>{inner}</Link> : inner;
}
const TONE: any = { PAID: "bg-green-100 text-green-700", ACTIVE: "bg-green-100 text-green-700", DELIVERED: "bg-green-100 text-green-700", READ: "bg-emerald-100 text-emerald-700", SENT: "bg-blue-100 text-blue-700",
  UNPAID: "bg-red-100 text-red-700", FAILED: "bg-red-100 text-red-700", REVERSED: "bg-gray-200 text-gray-600", PARTIAL: "bg-orange-100 text-orange-700", PENDING: "bg-yellow-100 text-yellow-700" };
export function Badge({ s }: { s: string }) { return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TONE[s] || "bg-gray-100 text-gray-700"}`}>{s === "PARTIAL" ? "PARTIALLY PAID" : s}</span>; }
export function Pager({ page, total, size = 25, onPage }: { page: number; total: number; size?: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size)); if (total <= size) return <div className="text-xs text-gray-400 mt-2">{total} record{total === 1 ? "" : "s"}</div>;
  return <div className="flex items-center justify-between mt-3 text-sm"><span className="text-gray-500">{total} records</span><div className="flex gap-2 items-center"><button className="btn btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</button><span>{page} / {pages}</span><button className="btn btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button></div></div>;
}
export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: boolean }) {
  return <div className="overflow-x-auto -mx-1"><table className="w-full text-sm"><thead><tr>{head.map(h => <th key={h} className="th">{h}</th>)}</tr></thead><tbody>{children}</tbody></table>{empty && <div className="text-center text-sm text-gray-400 py-6">Nothing to show</div>}</div>;
}

export async function sharePdf(url: string, filename: string) {
  try {
    const blob = await (await fetch(url)).blob(); const file = new File([blob], filename, { type: "application/pdf" }); const nav: any = navigator;
    if (nav.canShare && nav.canShare({ files: [file] })) { await nav.share({ files: [file], title: filename }); return; }
  } catch (e: any) { if (e?.name === "AbortError") return; }
  window.open(url, "_blank");
}

// WhatsApp action: uses the Cloud API; never claims success unless the API accepted it. Falls back to wa.me + manual PDF attach.
export function WaBtn({ type, id, customerId, label = "WhatsApp", className = "btn btn-sm", onDone }: { type: string; id?: number; customerId?: number; label?: string; className?: string; onDone?: () => void }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    if (busy) return; setBusy(true);
    try { const j = await api("/api/whatsapp/send", "POST", { type, id, customer_id: customerId }); alert(`Accepted by WhatsApp (status: ${j.status}). Delivery and read status appear in WhatsApp History once WhatsApp confirms them.`); onDone?.(); }
    catch (e: any) {
      const fb = e.data?.fallback;
      if (fb && confirm(`${e.message}\n\nOpen WhatsApp with a prefilled message instead? The PDF will open too – save it and attach it manually (this is NOT recorded as sent).`)) { window.open(fb.pdfUrl, "_blank"); window.open(fb.url, "_blank"); }
      else if (!fb) alert(e.message);
      onDone?.();
    } finally { setBusy(false); }
  }
  return <button className={className} disabled={busy} onClick={go}>{busy ? "Sending…" : <>💬 {label}</>}</button>;
}

export function Shell({ nav, brand, user, children }: { nav: { href: string; label: string; icon: string }[]; brand: string; user: string; children: ReactNode }) {
  const path = usePathname(), [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const root = nav[0].href;
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }
  return (
    <div className="min-h-screen">
      <aside className={`fixed inset-y-0 left-0 z-30 w-60 bg-white border-r border-gray-200 flex flex-col transition-transform ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="h-14 flex items-center px-4 border-b border-gray-100 font-bold text-blue-700">{brand}</div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {nav.map(n => { const active = n.href === root ? path === root : path.startsWith(n.href);
            return <Link key={n.href} href={n.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700 hover:bg-gray-100"}`}><span>{n.icon}</span>{n.label}</Link>; })}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200 h-14 flex items-center gap-3 px-4">
          <button className="btn lg:hidden" aria-label="Menu" onClick={() => setOpen(true)}>☰</button>
          <div className="font-semibold lg:hidden truncate">{brand}</div>
          <div className="ml-auto text-sm text-gray-600 hidden sm:block">{user}</div>
          <button className="btn" onClick={logout}>Logout</button>
        </header>
        <main className="p-4 md:p-6 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
export const Money = ({ v, tone }: { v: any; tone?: "green" | "red" }) => <span className={tone === "green" ? "text-green-600" : tone === "red" && Number(v) > 0.004 ? "text-orange-600 font-medium" : ""}>{inr(v)}</span>;
