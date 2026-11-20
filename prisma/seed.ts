import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const username = process.env.INITIAL_ADMIN_USERNAME || "Admin";
  const password = process.env.INITIAL_ADMIN_PASSWORD || "Nihar@4518";
  if (password.length < 8) throw new Error("INITIAL_ADMIN_PASSWORD must contain at least 8 characters.");
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    if (existing.role !== Role.ADMIN) throw new Error(`The username ${username} already exists but is not an admin.`);
    console.log(`Admin account ${username} already exists; password was not changed.`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { username, passwordHash, role: Role.ADMIN, active: true } });
    console.log(`Initial admin account created: ${username}`);
  }
  await prisma.companySettings.upsert({ where: { id: "main" }, update: {}, create: { id: "main", companyName: "MAHADEV CEMENT PRODUCT" } });
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
