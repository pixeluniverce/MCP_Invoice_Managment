-- ==========================================================
-- MAHADEV CEMENT PRODUCT - Neon PostgreSQL schema
-- How to use: Neon Console -> your project -> SQL Editor ->
-- paste this whole file -> Run. Safe to run more than once.
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS customers(
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, mobile TEXT NOT NULL UNIQUE, alt_mobile TEXT, address TEXT, city TEXT, state TEXT, pin TEXT, gstin TEXT,
  opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0, notes TEXT, active BOOLEAN NOT NULL DEFAULT TRUE, whatsapp_optin BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS users(
  id SERIAL PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('ADMIN','CUSTOMER')),
  customer_id INTEGER UNIQUE REFERENCES customers(id), must_change BOOLEAN NOT NULL DEFAULT FALSE, active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS products(
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT, hsn TEXT, rate NUMERIC(14,2) NOT NULL DEFAULT 0, unit TEXT NOT NULL DEFAULT 'Nos',
  gst_rate NUMERIC(6,3), active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS company_settings(
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id=1), name TEXT, address TEXT, mobile TEXT, email TEXT, gstin TEXT, state TEXT, state_code TEXT,
  invoice_prefix TEXT DEFAULT 'INV-', next_invoice INTEGER DEFAULT 1, next_receipt INTEGER DEFAULT 1, next_challan INTEGER DEFAULT 1,
  payment_terms TEXT, gst_enabled BOOLEAN DEFAULT FALSE, gst_type TEXT DEFAULT 'CGST_SGST', cgst NUMERIC(6,3) DEFAULT 9, sgst NUMERIC(6,3) DEFAULT 9, igst NUMERIC(6,3) DEFAULT 18,
  wa_phone TEXT, wa_phone_id TEXT, wa_waba_id TEXT, wa_token TEXT, wa_verify_token TEXT, wa_app_secret TEXT, wa_api_version TEXT DEFAULT 'v21.0',
  wa_template_name TEXT, wa_template_lang TEXT DEFAULT 'en');
INSERT INTO company_settings(id,name,address,state,state_code,payment_terms) VALUES(1,'Mahadev Cement Product','Ahmedabad, Gujarat','Gujarat','24','Payment due within 30 days of invoice date.') ON CONFLICT (id) DO NOTHING;
CREATE TABLE IF NOT EXISTS invoices(
  id SERIAL PRIMARY KEY, number TEXT NOT NULL UNIQUE, customer_id INTEGER NOT NULL REFERENCES customers(id), date DATE NOT NULL, due_date DATE,
  place_of_supply TEXT, gst_enabled BOOLEAN NOT NULL DEFAULT FALSE, gst_type TEXT NOT NULL DEFAULT 'NONE',
  subtotal NUMERIC(14,2) NOT NULL, discount_total NUMERIC(14,2) NOT NULL DEFAULT 0, taxable_total NUMERIC(14,2) NOT NULL,
  cgst_total NUMERIC(14,2) NOT NULL DEFAULT 0, sgst_total NUMERIC(14,2) NOT NULL DEFAULT 0, igst_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  other_charges NUMERIC(14,2) NOT NULL DEFAULT 0, other_label TEXT, grand_total NUMERIC(14,2) NOT NULL, notes TEXT,
  customer_snapshot JSONB, status TEXT NOT NULL DEFAULT 'ACTIVE', created_by INTEGER REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS invoice_items(
  id SERIAL PRIMARY KEY, invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, hsn TEXT,
  qty NUMERIC(14,3) NOT NULL, unit TEXT, rate NUMERIC(14,2) NOT NULL, discount NUMERIC(14,2) NOT NULL DEFAULT 0, amount NUMERIC(14,2) NOT NULL, taxable NUMERIC(14,2) NOT NULL,
  cgst_rate NUMERIC(6,3) NOT NULL DEFAULT 0, sgst_rate NUMERIC(6,3) NOT NULL DEFAULT 0, igst_rate NUMERIC(6,3) NOT NULL DEFAULT 0,
  cgst_amt NUMERIC(14,2) NOT NULL DEFAULT 0, sgst_amt NUMERIC(14,2) NOT NULL DEFAULT 0, igst_amt NUMERIC(14,2) NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS payments(
  id SERIAL PRIMARY KEY, receipt_no TEXT NOT NULL UNIQUE, customer_id INTEGER NOT NULL REFERENCES customers(id), date DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount>0), mode TEXT NOT NULL, reference TEXT, notes TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE',
  reversed_at TIMESTAMPTZ, reverse_reason TEXT, created_by INTEGER REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS payment_allocations(
  id SERIAL PRIMARY KEY, payment_id INTEGER NOT NULL REFERENCES payments(id), invoice_id INTEGER NOT NULL REFERENCES invoices(id), amount NUMERIC(14,2) NOT NULL CHECK (amount>0));
CREATE TABLE IF NOT EXISTS delivery_challans(
  id SERIAL PRIMARY KEY, number TEXT NOT NULL UNIQUE, customer_id INTEGER NOT NULL REFERENCES customers(id), date DATE NOT NULL, vehicle_no TEXT, transport TEXT, notes TEXT,
  customer_snapshot JSONB, created_by INTEGER REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS challan_items(
  id SERIAL PRIMARY KEY, challan_id INTEGER NOT NULL REFERENCES delivery_challans(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, qty NUMERIC(14,3) NOT NULL, unit TEXT);
CREATE TABLE IF NOT EXISTS whatsapp_messages(
  id SERIAL PRIMARY KEY, customer_id INTEGER REFERENCES customers(id), mobile TEXT NOT NULL, type TEXT NOT NULL, ref_id INTEGER, ref_label TEXT, wa_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING', error TEXT, sent_by INTEGER REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS whatsapp_webhook_events(id SERIAL PRIMARY KEY, payload JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS activity_logs(id SERIAL PRIMARY KEY, user_id INTEGER, action TEXT NOT NULL, details TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS login_attempts(id SERIAL PRIMARY KEY, username TEXT NOT NULL, ip TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_inv_cust ON invoices(customer_id, date);
CREATE INDEX IF NOT EXISTS idx_inv_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idx_items_inv ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_pay_cust ON payments(customer_id, date);
CREATE INDEX IF NOT EXISTS idx_pay_date ON payments(date);
CREATE INDEX IF NOT EXISTS idx_alloc_inv ON payment_allocations(invoice_id);
CREATE INDEX IF NOT EXISTS idx_alloc_pay ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_wa_cust ON whatsapp_messages(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_wa_mid ON whatsapp_messages(wa_message_id);
CREATE INDEX IF NOT EXISTS idx_chal_cust ON delivery_challans(customer_id);
CREATE INDEX IF NOT EXISTS idx_login_att ON login_attempts(username, created_at);
CREATE INDEX IF NOT EXISTS idx_cust_name ON customers(lower(name));

-- ==========================================================
-- FIRST ADMIN LOGIN
-- Username: admin   Temporary password: Admin@12345
-- You must change the password at first login.
-- (Change the two values below before running if you want.)
-- ==========================================================
INSERT INTO users(username, password_hash, role, must_change)
SELECT 'admin', crypt('Admin@12345', gen_salt('bf', 10)), 'ADMIN', TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role='ADMIN');
