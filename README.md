# MAHADEV CEMENT PRODUCT — deployable application foundation

This repository contains the current Next.js application foundation and the complete master specification. It includes Neon/PostgreSQL + Prisma data models, password-hashed admin seeding, role-aware login sessions, an admin dashboard summary, and an admin-only customer creation API.

> **Scope warning:** this is not yet the complete billing/accounting system. Invoice creation/editing, GST calculation workflow, payment allocation/reversal, customer portal pages, PDF generation, delivery challans, reports/exports, WhatsApp sending/webhooks, audit coverage, and comprehensive automated tests remain to be implemented. Do not use it as the live accounting source of truth until those stages are completed and tested. The dashboard labels outstanding as an estimate.

## Requirements
- Node.js 20.9 or newer; Git; Neon PostgreSQL; GitHub and Vercel accounts.

## 1. Configure Neon
1. Create a PostgreSQL project at https://console.neon.tech.
2. Copy the pooled connection string into `DATABASE_URL`.
3. Copy the direct/non-pooled connection string into `DIRECT_URL`. These are database URLs, not website domains.
4. Keep both strings private. Never commit `.env`.

## 2. Run locally (Windows PowerShell)
```powershell
npm install
Copy-Item .env.example .env
```
Edit `.env` and replace both Neon URLs and `AUTH_SECRET`. Initial admin defaults are `Admin` / `Nihar@4518`. Then run:
```powershell
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```
Open http://localhost:3000. The seed creates the admin only if that username does not already exist; later runs do not reset its password.

## 3. Push to GitHub
Create an empty GitHub repository, then run these commands in this folder (replace the URL):
```powershell
git init
git add .
git commit -m "Initial MAHADEV CEMENT PRODUCT app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

## 4. Deploy on Vercel and connect Neon
1. Import the GitHub repository in Vercel; keep root directory `./`.
2. In Vercel → Settings → Environment Variables, add `DATABASE_URL` (Neon pooled URL), `DIRECT_URL` (Neon direct URL), `AUTH_SECRET` (unique random secret, 32+ chars), `APP_URL` (your generated `https://your-project.vercel.app` URL), `INITIAL_ADMIN_USERNAME` (`Admin`), and `INITIAL_ADMIN_PASSWORD` (`Nihar@4518`). Add them to Production (and Preview if needed).
3. Deploy. `vercel.json` runs `npm run vercel-build`: Prisma Client generation, schema sync with `prisma db push`, initial admin creation if absent, then Next.js build.
4. Vercel provides a free `*.vercel.app` domain; you do not need to buy one.

**Database caution:** `prisma db push` is included for simple first deployment. For business-critical production, move to reviewed Prisma migrations (`prisma migrate deploy`) before ongoing schema changes and back up Neon before schema changes.

## 5. Security
The initial password is included because it was explicitly requested. Change it before sharing the deployment; do not reuse it elsewhere. Never expose secrets with `NEXT_PUBLIC_`, never commit `.env`, and use a unique `AUTH_SECRET`. Add rate limiting, CSRF/origin protections, complete audit logging, backups and restore tests before public production use.

## 6. Current implementation status
See `MAHADEV_MASTER_SPECIFICATION.md` for the full requested scope. This ZIP is the foundation stage, not a claim that all modules are finished. WhatsApp variables are placeholders; this starter does not send WhatsApp messages.
