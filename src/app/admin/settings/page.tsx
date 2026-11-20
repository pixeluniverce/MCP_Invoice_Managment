"use client";
import { useEffect, useState } from "react";
import { api, useApi, State, Card } from "@/components/ui";
export default function Settings() {
  const { data, err, loading, reload } = useApi<any>("/api/settings");
  const [f, setF] = useState<any>(null), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false), [origin, setOrigin] = useState("");
  useEffect(() => { if (data) setF({ ...data, wa_token: "", wa_verify_token: "", wa_app_secret: "" }); setOrigin(window.location.origin); }, [data]);
  if (!f) return <State loading={loading} err={err} />;
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const I = (k: string, l: string, t = "text", ph = "") => <div><label className="label">{l}</label><input className="input" type={t} value={f[k] ?? ""} onChange={set(k)} placeholder={ph} /></div>;
  async function save() { setBusy(true); setMsg(""); try { await api("/api/settings", "PUT", f); setMsg("Settings saved"); reload(); } catch (e: any) { setMsg(e.message); } finally { setBusy(false); } }
  async function test() { setMsg("Testing…"); try { await api("/api/settings", "PUT", f); const j = await api("/api/settings/wa-test", "POST"); setMsg(`Connected: ${j.info.verified_name || ""} ${j.info.display_phone_number || ""}`); reload(); } catch (e: any) { setMsg("Connection failed: " + e.message); } }
  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold">Settings</h1><button className="btn-primary" disabled={busy} onClick={save}>Save all settings</button></div>
      {msg && <div className="rounded-lg bg-blue-50 text-blue-800 text-sm p-3">{msg}</div>}
      <Card title="Company details"><div className="grid sm:grid-cols-2 gap-3">{I("name", "Company name")}{I("mobile", "Mobile")}{I("address", "Address")}{I("email", "Email")}{I("gstin", "GSTIN")}{I("state", "State")}{I("state_code", "State code")}</div></Card>
      <Card title="Invoice settings"><div className="grid sm:grid-cols-3 gap-3">{I("invoice_prefix", "Invoice prefix")}{I("next_invoice", "Next invoice number", "number")}{I("payment_terms", "Payment terms")}</div><p className="text-xs text-gray-500 mt-2">Invoice numbers are generated automatically and safely (no duplicates).</p></Card>
      <Card title="GST defaults (used for new invoices only)">
        <label className="flex items-center gap-2 mb-3"><input type="checkbox" checked={!!f.gst_enabled} onChange={set("gst_enabled")} /> Enable GST by default</label>
        <div className="grid sm:grid-cols-4 gap-3"><div><label className="label">Default type</label><select className="input" value={f.gst_type} onChange={set("gst_type")}><option value="CGST_SGST">CGST + SGST</option><option value="IGST">IGST</option></select></div>{I("cgst", "CGST %", "number")}{I("sgst", "SGST %", "number")}{I("igst", "IGST %", "number")}</div></Card>
      <Card title="WhatsApp Business Cloud API">
        <div className="grid sm:grid-cols-2 gap-3">{I("wa_phone", "Business phone number")}{I("wa_phone_id", "Phone Number ID")}{I("wa_waba_id", "WhatsApp Business Account ID")}{I("wa_api_version", "API version", "text", "v21.0")}
          {I("wa_token", "Meta access token", "password", f.wa_token_set ? "•••••• saved (leave blank to keep)" : "Paste permanent token")}{I("wa_verify_token", "Webhook verify token", "password", f.wa_verify_token_set ? "•••••• saved" : "Any secret string you choose")}
          {I("wa_app_secret", "Meta App Secret (verifies webhook signatures)", "password", f.wa_app_secret_set ? "•••••• saved" : "Recommended")}{I("wa_template_name", "Approved template name (optional)")}{I("wa_template_lang", "Template language", "text", "en")}</div>
        <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 mt-3 space-y-1"><div>Webhook URL for Meta: <b>{origin}/api/whatsapp/webhook</b> (subscribe to “messages”).</div><div>Without a template, WhatsApp only delivers PDFs to customers who messaged your number in the last 24 hours. For other customers, create an approved template with a DOCUMENT header and one body variable and enter its name above.</div><div>Tokens are stored server-side only and never sent to the browser. You can instead set the WHATSAPP_TOKEN environment variable in Vercel.</div></div>
        <button className="btn mt-3" onClick={test}>Save & test connection</button></Card>
    </div>
  );
}
