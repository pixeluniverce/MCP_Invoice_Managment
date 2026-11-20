export class HttpError extends Error {
  status: number; code?: string;
  constructor(status: number, msg: string, code?: string) { super(msg); this.name = "HttpError"; this.status = status; this.code = code; }
}
