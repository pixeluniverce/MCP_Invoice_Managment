import { NextResponse } from "next/server";
import { getSession, Session } from "./auth";
import { q } from "./db";
import { HttpError } from "./errors";
export { HttpError };

export const json = (d: any, status = 200) => NextResponse.json(d, { status, headers: { "Cache-Control": "no-store" } });
type Ctx = { s: Session; params: any };

// Every API handler goes through here: authentication + role check + error mapping.
export function route(roles: ("admin" | "customer")[], fn: (req: Request, ctx: Ctx) => Promise<any>, opts: { allowMustChange?: boolean } = {}) {
  return async (req: Request, c: any) => {
    try {
      const s = await getSession();
      if (!s) return json({ error: "Please log in" }, 401);
      if (!roles.includes(s.role)) return json({ error: "Forbidden" }, 403);
      if (s.mustChange && !opts.allowMustChange) return json({ error: "Change your password first" }, 403);
      const out = await fn(req, { s, params: c?.params || {} });
      return out instanceof Response ? out : json(out);
    } catch (e: any) {
      if (e instanceof HttpError || e?.name === "HttpError") return json({ error: e.message, code: e.code, fallback: e.fallback }, e.status);
      if (e?.code === "23505") return json({ error: "Duplicate value: that record already exists" }, 409);
      if (e?.code === "23503") return json({ error: "Referenced record not found or still in use" }, 409);
      console.error(e);
      return json({ error: "Server error" }, 500);
    }
  };
}
export const body = async (req: Request) => { try { return await req.json(); } catch { throw new HttpError(400, "Invalid request body"); } };
export const need = (c: any, m: string) => { if (!c) throw new HttpError(400, m); };
export const num = (v: any, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
export const isDate = (s: any) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
export const digits = (s: any) => String(s ?? "").replace(/\D/g, "");
export const log = (uid: number | null, action: string, details = "") => q("INSERT INTO activity_logs(user_id,action,details) VALUES($1,$2,$3)", [uid, action, details]).catch(() => {});
export const qs = (req: Request) => new URL(req.url).searchParams;
