"use client";
import { useState } from "react";
export default function ChangePassword() {
  const [cur, setCur] = useState(""), [pw, setPw] = useState(""), [pw2, setPw2] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (pw !== pw2) return setErr("Passwords do not match");
    setBusy(true);
    const r = await fetch("/api/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current: cur, password: pw }) });
    const j = await r.json().catch(() => ({})); setBusy(false);
    if (!r.ok) return setErr(j.error || "Failed");
    window.location.href = j.role === "admin" ? "/admin" : "/portal";
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6">
        <h1 className="text-xl font-bold">Set a new password</h1>
        <p className="text-sm text-gray-500">Use at least 8 characters with letters and numbers.</p>
        <div><label className="label">Current / temporary password</label><input className="input" type="password" value={cur} onChange={e => setCur(e.target.value)} /></div>
        <div><label className="label">New password</label><input className="input" type="password" value={pw} onChange={e => setPw(e.target.value)} /></div>
        <div><label className="label">Confirm new password</label><input className="input" type="password" value={pw2} onChange={e => setPw2(e.target.value)} /></div>
        {err && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{err}</div>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Save password"}</button>
      </form>
    </div>
  );
}
