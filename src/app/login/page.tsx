"use client";
import { useState } from "react";
export default function Login() {
  const [u, setU] = useState(""), [p, setP] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false), [forgot, setForgot] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, password: p }) });
    const j = await r.json().catch(() => ({})); setBusy(false);
    if (!r.ok) return setErr(j.error || "Login failed");
    window.location.href = j.mustChange ? "/change-password" : j.role === "admin" ? "/admin" : "/portal";
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6">
        <div className="text-center"><div className="text-2xl font-bold text-blue-700">Mahadev Cement Product</div><div className="text-sm text-gray-500 mt-1">Sign in to your account</div></div>
        <div><label className="label">Mobile number or username</label><input className="input" value={u} onChange={e => setU(e.target.value)} autoComplete="username" autoFocus /></div>
        <div><label className="label">Password</label><input className="input" type="password" value={p} onChange={e => setP(e.target.value)} autoComplete="current-password" /></div>
        {err && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{err}</div>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <button type="button" className="text-sm text-blue-600 w-full" onClick={() => setForgot(!forgot)}>Forgot password?</button>
        {forgot && <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">For security, passwords are reset by Mahadev Cement Product. Please contact us and we will give you a temporary password. You will be asked to choose a new one at your next login.</div>}
      </form>
    </div>
  );
}
