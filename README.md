# Mahadev Cement Product – Billing & Customer Portal

Next.js 14 (App Router) · TypeScript · Tailwind · Neon PostgreSQL (`pg`) · pdf-lib · WhatsApp Cloud API

## Easiest way: run the SQL file yourself
1. Neon Console -> SQL Editor -> paste `database/neon-schema.sql` -> Run (creates all tables + admin `admin` / `Admin@12345`).
2. In Vercel add env vars `DATABASE_URL` (Neon pooled connection string) and `AUTH_SECRET`, then deploy.
3. Log in at `/login` as `admin` / `Admin@12345` and set a new password when asked.
(The `/api/setup` route below is an alternative that does the same thing, so you can skip it.)

## Deploy on Vercel (about 10 minutes)

1. Push this folder to a GitHub repo and **Import** it in Vercel.
2. In the Vercel project → **Storage → Create/Connect Neon** (Postgres). This adds `DATABASE_URL` automatically.
3. Project → **Settings → Environment Variables**, add:
   - `AUTH_SECRET` – long random string (e.g. `openssl rand -base64 48`)
   - `SETUP_KEY` – any secret string (used once)
   - `ADMIN_USERNAME` – e.g. `admin`
   - `ADMIN_PASSWORD` – 8+ characters
   - (optional) `WHATSAPP_TOKEN`
4. **Deploy**.
5. Open once: `https://YOUR-APP.vercel.app/api/setup?key=YOUR_SETUP_KEY`
   You should see `{"ok":true,"adminCreated":true}`. This creates all tables and the admin login.
6. Go to `/login`, sign in as admin, open **Settings** and fill company details (name, address, GSTIN, state).
   Then remove `SETUP_KEY` / `ADMIN_PASSWORD` from Vercel env vars if you like.

## WhatsApp
Settings → WhatsApp: Phone Number ID, Business Account ID, access token, verify token (+ app secret).
Webhook URL for Meta: `https://YOUR-APP.vercel.app/api/whatsapp/webhook` (subscribe to `messages`).
Sending a PDF without a template only works for customers who messaged your number in the last 24h; otherwise create an
approved template (DOCUMENT header + 1 body variable) and enter its name in Settings.
If the API fails, the app offers the fallback (open WhatsApp with prefilled text + download PDF) and does NOT record it as sent.

## Notes
- Money: stored as NUMERIC(14,2); invoice totals are always recalculated on the server.
- Outstanding = opening balance + invoices – payments. Bill status comes from payment allocations.
- PDFs use standard fonts: Latin text only, ₹ is printed as "Rs.". Non-Latin names print as "?".
