import { Pool, types } from "pg";
types.setTypeParser(1700, (v: string) => parseFloat(v)); // numeric -> number
types.setTypeParser(20, (v: string) => parseInt(v, 10));  // bigint -> number
types.setTypeParser(1082, (v: string) => v);               // date -> 'YYYY-MM-DD'

const g = globalThis as any;
export const pool: Pool = g.__pool || (g.__pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 }));

export async function q(text: string, params: any[] = []): Promise<any[]> {
  const r = await pool.query(text, params);
  return r.rows;
}
export async function tx<T>(fn: (c: any) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try { await c.query("BEGIN"); const r = await fn(c); await c.query("COMMIT"); return r; }
  catch (e) { await c.query("ROLLBACK").catch(() => {}); throw e; }
  finally { c.release(); }
}
