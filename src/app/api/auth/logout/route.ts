import { NextResponse } from "next/server";
import { cookies } from "next/headers";
export async function GET() { (await cookies()).delete("mcp_session"); return NextResponse.redirect(new URL("/login", process.env.APP_URL || "http://localhost:3000")); }