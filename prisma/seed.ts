import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
 const username = process.env.INITIAL_ADMIN_USERNAME || "admin";
 const password = process.env.INITIAL_ADMIN_PASSWORD;
 if (!password || password.length < 12) throw new Error("Set INITIAL_ADMIN_PASSWORD to at least 12 characters before seeding.");
 const passwordHash = await bcrypt.hash(password, 12);
 await prisma.user.upsert({ where:{username}, update:{passwordHash,role:Role.ADMIN,active:true}, create:{username,passwordHash,role:Role.ADMIN} });
 await prisma.companySettings.upsert({where:{id:"main"},update:{},create:{id:"main",companyName:"MAHADEV CEMENT PRODUCT"}});
 console.log(`Admin account ready: ${username}`);
}
main().finally(()=>prisma.$disconnect());
