import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
 code:z.string().trim().min(1).max(30), name:z.string().trim().min(1).max(150),
 mobile:z.string().trim().min(6).max(20), address:z.string().optional(),
 city:z.string().optional(), state:z.string().optional(), pincode:z.string().optional(),
 gstin:z.string().optional(), openingBalance:z.number().finite().default(0)
});
export async function GET() {
 try { await requireAdmin(); const rows=await prisma.customer.findMany({where:{active:true},orderBy:{name:"asc"},take:100}); return NextResponse.json(rows); }
 catch { return NextResponse.json({error:"Unauthorized"},{status:401}); }
}
export async function POST(req:Request) {
 try {
  await requireAdmin(); const parsed=schema.safeParse(await req.json());
  if(!parsed.success) return NextResponse.json({error:parsed.error.flatten()},{status:400});
  const customer=await prisma.customer.create({data:{...parsed.data,openingBalance:parsed.data.openingBalance}});
  return NextResponse.json(customer,{status:201});
 } catch(e) { return NextResponse.json({error:e instanceof Error&&e.message==="FORBIDDEN"?"Unauthorized":"Could not create customer. Check for duplicate customer code."},{status:401}); }
}