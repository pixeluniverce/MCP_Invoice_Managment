"use client";
import { useState } from "react";
import { api, useApi, useDebounce, State, Card, Table, Badge, inr } from "@/components/ui";
const blank = { name: "", description: "", hsn: "", rate: "", unit: "Nos", gst_rate: "", active: true };
export default function Products() {
  const [search, setSearch] = useState(""), ds = useDebounce(search), { data, err, loading, reload } = useApi<any>(`/api/products?search=${encodeURIComponent(ds)}`);
  const [f, setF] = useState<any>(null), [msg, setMsg] = useState("");
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  async function save() { setMsg(""); try { f.id ? await api(`/api/products/${f.id}`, "PUT", f) : await api("/api/products", "POST", f); setF(null); reload(); } catch (e: any) { setMsg(e.message); } }
  const I = (k: string, l: string, t = "text") => <div><label className="label">{l}</label><input className="input" type={t} value={f[k] ?? ""} onChange={set(k)} /></div>;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold">Products</h1><button className="btn-primary" onClick={() => setF({ ...blank })}>+ Add Product</button></div>
      {f && <Card title={f.id ? "Edit product" : "New product"}><div className="grid sm:grid-cols-3 gap-3">{I("name", "Product name *")}{I("description", "Description")}{I("hsn", "HSN code")}{I("rate", "Default rate (₹)", "number")}{I("unit", "Unit")}{I("gst_rate", "Default GST % (total, optional)", "number")}</div>
        {f.id && <label className="flex items-center gap-2 text-sm mt-3"><input type="checkbox" checked={f.active} onChange={set("active")} /> Active</label>}
        {msg && <div className="text-sm text-red-600 mt-2">{msg}</div>}<div className="flex gap-2 mt-3"><button className="btn-primary" onClick={save}>Save</button><button className="btn" onClick={() => setF(null)}>Cancel</button></div></Card>}
      <Card><div className="w-full sm:w-64 mb-3"><input className="input" placeholder="Search products" value={search} onChange={e => setSearch(e.target.value)} /></div><State loading={loading && !data} err={err} />
        <Table head={["Product", "HSN", "Rate", "Unit", "GST %", "Status", ""]} empty={!loading && !data?.rows.length}>{(data?.rows || []).map((p: any) => <tr key={p.id}><td className="td font-medium">{p.name}<div className="text-xs text-gray-400">{p.description}</div></td><td className="td">{p.hsn || "-"}</td><td className="td text-right">{inr(p.rate)}</td><td className="td">{p.unit}</td><td className="td">{p.gst_rate ?? "-"}</td><td className="td"><Badge s={p.active ? "ACTIVE" : "REVERSED"} /></td><td className="td"><button className="btn btn-sm" onClick={() => setF({ ...p, gst_rate: p.gst_rate ?? "" })}>Edit</button></td></tr>)}</Table></Card>
    </div>
  );
}
