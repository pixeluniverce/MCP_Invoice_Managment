import { route } from "@/lib/api";
import { waTest } from "@/lib/wa";
export const POST = route(["admin"], async () => ({ ok: true, info: await waTest() }));
