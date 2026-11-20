# MAHADEV CEMENT PRODUCT — application foundation

This ZIP contains a deployable Next.js foundation for the billing system described in the supplied master specification. It includes a Neon/Prisma schema, database client, secure HTTP-only signed sessions, role-aware login, admin dashboard summary, customer creation API, and admin seed script.

**Important scope note:** This is a foundation/starter, not yet the complete feature set in the master prompt. Invoice creation/editing, tax engine, payment allocation/reversals, customer portal pages, PDFs, delivery challans, reports, full audit coverage and live Meta WhatsApp document delivery still need implementation. Do not use it for production accounting until those modules and tests are completed.

## Requirements
- Node.js 20.9+
- Neon PostgreSQL database
- GitHub + Vercel account

## Local setup
1. Extract the ZIP and open the project folder.
2. Install packages: `npm install`
3. Copy `.env.example` to `.env`.
4. In Neon, create a PostgreSQL project and copy its pooled connection string into `DATABASE_URL`. Put the direct connection string in `DIRECT_URL`. Keep both private.
5. Set `AUTH_SECRET` to a random secret of at least 32 characters. Example generation: `openssl rand -base64 48`.
6. Set `INITIAL_ADMIN_USERNAME` and `INITIAL_ADMIN_PASSWORD` in your `.env` file before seeding. Use a unique password of at least 12 characters.
7. Run:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   npm run dev
   ```
8. Open `http://localhost:3000` and sign in with the admin credentials configured for the seed.

For a tracked migration workflow, use `npx prisma migrate dev --name init` during development, commit the generated `prisma/migrations` folder, and run `npx prisma migrate deploy` in production.

## Vercel deployment
1. Push this folder to a new GitHub repository.
2. Import the repository in Vercel.
3. Add `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, and `APP_URL` in Vercel Project Settings → Environment Variables. Add WhatsApp variables only after configuring Meta Cloud API.
4. Deploy. For production schema changes, commit Prisma migrations and run `npx prisma migrate deploy` as a controlled deployment step. Do not run `db push` as a production migration strategy.
5. Create the first admin using a secure one-time provisioning process. For initial setup, run the seed command in a trusted environment with `INITIAL_ADMIN_USERNAME` and `INITIAL_ADMIN_PASSWORD` set. Never commit credentials.

## Security and deployment notes
- Do not expose database or WhatsApp credentials through `NEXT_PUBLIC_*`.
- Configure a strong `AUTH_SECRET`; the app intentionally refuses weak/missing secrets.
- Add rate limiting at the edge or through a shared store before exposing login publicly.
- Configure backups and test restore procedures in Neon.
- Restrict customer API access by authenticated role; extend customer routes using the session's `customerId`, never a browser-supplied customer ID.
- The current customer creation endpoint is admin-only. Add CSRF/origin protections and audit events as part of production hardening.
- WhatsApp API credentials are placeholders only; no live messages are sent by this starter.

## Included master specification
See `MAHADEV_MASTER_SPECIFICATION.md` for the full requested feature and development scope.
