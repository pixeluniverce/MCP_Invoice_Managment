# MASTER DEVELOPMENT PROMPT — MAHADEV CEMENT PRODUCT

Act as a senior full-stack software architect, Next.js developer, PostgreSQL database engineer, UI/UX designer and deployment engineer.

Your task is to BUILD a complete, production-oriented business billing and management web application for **MAHADEV CEMENT PRODUCT**.

This must be a real working application, not a prototype, static dashboard or frontend demo.

## 1. MOST IMPORTANT DEVELOPMENT RULES

I am using Claude AI Free Plan. Therefore, follow these rules strictly:

1. Build the application in manageable development stages.
2. Never generate the entire project in one enormous response.
3. Maintain a consistent project architecture across all stages.
4. Never remove previously implemented features when adding new features.
5. Never replace working functionality with dummy data.
6. Never create buttons that do nothing.
7. Never use localStorage as the permanent database.
8. All business data must be saved in Neon PostgreSQL.
9. All financial calculations must happen reliably using server-side logic.
10. Use reusable components and clean TypeScript.
11. Provide complete code for every file you create or modify.
12. Never write incomplete code using comments such as "add your code here".
13. Do not skip database migrations, authentication, API routes or error handling.
14. Keep track of completed and pending development stages.
15. Do not claim something is tested unless you actually verified it.

If the response limit is reached, stop at a completed file and tell me exactly which stage and files are pending.

When I reply CONTINUE, resume from the last unfinished task without restarting the project.

## 2. TECHNOLOGY STACK

Use:

- Next.js with App Router.
- React.
- TypeScript.
- Tailwind CSS.
- Neon PostgreSQL.
- Prisma ORM with a Neon-compatible serverless connection strategy.
- Secure authentication using Auth.js or an appropriate secure session-based solution.
- Zod for validation.
- Recharts for lightweight charts.
- A reliable PDF generation library.
- Official Meta WhatsApp Business Cloud API.
- Vercel deployment.

Use the latest mutually compatible stable package versions available when building.

### Database connection

The application must connect directly to my Neon PostgreSQL database through environment variables.

Use:

DATABASE_URL=YOUR_NEON_POOLED_CONNECTION_STRING
DIRECT_URL=YOUR_NEON_DIRECT_CONNECTION_STRING

Configure Prisma migrations correctly for Neon and Vercel.

Never hardcode database credentials.

The application must work after I connect my Neon database and configure Vercel environment variables.

## 3. DESIGN AND USER EXPERIENCE

Create a premium, modern business management interface.

Theme:
- White background.
- Light grey secondary backgrounds.
- Dark charcoal text.
- Blue primary buttons.
- Green for paid amounts.
- Red/orange for outstanding amounts.
- Subtle borders.
- Professional cards.
- Clean typography.

Admin layout:
- Fixed desktop sidebar.
- Responsive mobile navigation.
- Top navigation.
- Dashboard cards.
- Searchable tables.
- Attractive charts.
- Professional forms.

Customer layout:
- Simple navigation.
- Mobile-friendly dashboard.
- Clear invoice history.
- Paid and pending bill sections.
- Easy PDF downloads.

The application must be responsive on desktop, tablet and mobile.

Avoid excessive animations, heavy libraries and unnecessary API requests.

## 4. TWO USER ROLES

Create two separate roles:

### ADMIN

Admin has complete control over the application.

Admin can:
- Manage customers.
- Manage products.
- Create and edit invoices.
- Generate delivery challans.
- Manage GST.
- Record payments.
- Allocate payments to invoices.
- View all invoices.
- View paid and pending bills.
- Manage outstanding balances.
- View customer ledgers.
- Generate PDFs.
- Send invoices through WhatsApp.
- Send payment receipts.
- Send outstanding reminders.
- Create customer login accounts.
- Reset customer passwords.
- Manage company settings.
- View reports.
- Export Excel, CSV and PDF.

### CUSTOMER

Every customer must have a separate secure login.

Customers can:
- View their dashboard.
- View total purchases.
- View total paid.
- View outstanding balances.
- View all invoices.
- View paid invoices.
- View unpaid invoices.
- View partially paid invoices.
- View payment history.
- View customer ledger.
- Download invoice PDFs.
- Download payment receipts.
- Download account statements.

Customers must NEVER access another customer's information or admin features.

Enforce all permissions on the backend.

## 5. CUSTOMER LOGIN MANAGEMENT

Admin can create customer login accounts from the customer profile.

Fields:
- Customer name.
- Mobile number.
- Username.
- Temporary password.
- Account status.
- Login enabled/disabled.

Important:
- One customer must have one linked login.
- Do not create duplicate customer records.
- Hash passwords securely.
- Require password change on first login.
- Support password reset.
- Support account activation and deactivation.
- Track last login.

## 6. ADMIN DASHBOARD

Display:

- Total Sales.
- Total Received.
- Total Outstanding.
- Monthly Collection.
- Total Customers.
- Total Invoices.
- Paid Invoices.
- Pending Invoices.

Charts:
- Monthly collection.
- Sales versus collection.
- Customer outstanding.
- Paid versus unpaid invoices.

Recent activity:
- New invoices.
- New customers.
- Payments.
- WhatsApp messages.
- Delivery challans.

Filters:
- Today.
- Yesterday.
- This week.
- This month.
- Last month.
- This year.
- Custom dates.

All figures must come from actual database records.

## 7. CUSTOMER DASHBOARD

Show four summary cards:

1. Total Purchase.
2. Total Paid.
3. Total Outstanding.
4. Total Bills.

Create separate pages:

- Dashboard.
- All Bills.
- Paid Bills.
- Pending Bills.
- Payment History.
- Customer Ledger.
- Account Settings.

Customer must be able to view and download their own invoices, receipts and statements.

## 8. CUSTOMER MANAGEMENT

Customer fields:

- Customer ID.
- Customer Name.
- Mobile Number.
- Alternate Number.
- Address.
- City.
- State.
- PIN Code.
- GSTIN.
- Opening Balance.
- Notes.

Admin actions:
- Add.
- Edit.
- View.
- Deactivate.
- Create Login.
- Reset Password.
- Send WhatsApp.
- Download Ledger.

Repeated purchases must remain under the same customer account.

## 9. PRODUCT MANAGEMENT

Create a complete product management module.

Fields:

- Product Code.
- Product Name.
- Description.
- HSN Code.
- Unit.
- Rate.
- GST Percentage.
- Active/Inactive.

Features:
- Add product.
- Edit product.
- Search product.
- Deactivate product.
- Product-wise reports.
- Bulk import using CSV or Excel-compatible pasted data.

Bulk import format:

CODE,Name,Rate

Example:

4FT15PATIYA,4ft*15" patiya,38
18"24"2||"D,18"*24"*2||"D,26
18"24"2||"R,18"*24"*2||"R,31
1BOLEROFERA,1 Pickup,150
FOLDING,Folding,650

Rules:
- One item per line.
- Skip existing product codes.
- Validate duplicate codes within the import.
- Show successful and failed imports.
- Provide downloadable import error reports.

## 10. INVOICE GENERATION

Create a professional invoice creation system.

Invoice fields:

- Invoice Number.
- Invoice Date.
- Due Date.
- Customer.
- Address.
- Mobile.
- GSTIN.
- Place of Supply.

Multiple product rows:

- Product.
- Description.
- HSN.
- Quantity.
- Unit.
- Rate.
- Discount.
- GST Percentage.
- Taxable Amount.
- Total Amount.

Allow:
- Add rows.
- Remove rows.
- Search saved products.
- Automatically populate product rates.
- Edit quantities and rates.
- Add discounts.
- Add additional charges.
- Save invoice.
- Preview invoice.
- Download PDF.
- Print.
- Send through WhatsApp.

Automatically calculate all totals.

Use decimal-safe financial calculations and proper currency rounding.

Save invoice item names, rates and tax details as historical snapshots so old invoices never change when products are edited.

## 11. COMPLETE GST MANAGEMENT

GST must be optional.

Add an Enable/Disable GST setting.

When GST is enabled, support:

### CGST + SGST

Default:
- CGST 9%.
- SGST 9%.

### IGST

Default:
- IGST 18%.

### Custom GST

Admin must be able to enter any percentage.

Examples:
- 0%.
- 2.5%.
- 3%.
- 5%.
- 6%.
- 9%.
- 12%.
- 18%.
- 28%.
- Any custom percentage.

Formula:

Tax Amount = Taxable Amount × GST Percentage / 100

CGST + SGST:
Grand Total = Taxable Amount + CGST + SGST.

IGST:
Grand Total = Taxable Amount + IGST.

Requirements:
- Support product-wise GST.
- Support different GST rates on different invoice items.
- Never apply IGST and CGST/SGST together on the same supply.
- Determine intra-state versus inter-state tax using supplier state and place of supply.
- Allow admin verification.
- Save historical tax rates on every invoice.
- Never change old invoice calculations when GST settings change.

## 12. PAYMENT MANAGEMENT

Create complete payment management.

Support:
- Full payment.
- Partial payment.
- Multiple payments.
- Advance payments.
- One payment allocated to multiple invoices.
- Payment allocation.
- Payment correction through reversal.
- Payment history.

Payment modes:
- Cash.
- UPI.
- Bank Transfer.
- Cheque.
- Other.

Example:

Customer has:

Invoice 001 = ₹7,000
Invoice 002 = ₹5,000
Invoice 003 = ₹3,000

Total Purchase = ₹15,000.

Payment received = ₹7,000 against Invoice 001.

Expected:
- Invoice 001: PAID.
- Invoice 002: UNPAID.
- Invoice 003: UNPAID.
- Total Paid: ₹7,000.
- Outstanding: ₹8,000.

Create automatic payment receipts with unique receipt numbers.

All payment allocations must be saved using database transactions.

Prevent overpayment and duplicate payment submissions unless explicitly handled as an advance.

## 13. OUTSTANDING MANAGEMENT

Create a dedicated outstanding page.

Display:

- Customer.
- Mobile.
- Total Purchase.
- Total Paid.
- Total Outstanding.
- Pending Bills.
- Last Payment Date.

Sorting:
- Highest Outstanding.
- Lowest Outstanding.
- Oldest Pending.
- Newest Pending.

Actions:
- Record Payment.
- View Ledger.
- Download Statement.
- Send WhatsApp Reminder.

Calculate balances using actual invoices, opening balances, payment allocations and reversals.

## 14. CUSTOMER LEDGER

Create a complete date-wise ledger.

Example:

Date | Description | Debit | Credit | Balance

Opening Balance
Invoice
Payment
Invoice
Payment

Support:
- Opening balance.
- Invoice debits.
- Payment credits.
- Payment reversals.
- Running balance.
- Custom date filters.
- PDF download.
- Excel export.
- Print.

The ledger must accurately reconcile with customer outstanding balances.

## 15. DELIVERY CHALLANS

Create a separate delivery challan module.

Fields:
- Challan Number.
- Challan Date.
- Customer.
- Products.
- Quantity.
- Unit.
- Vehicle Number.
- Transport Details.
- Description.
- Signature.

Actions:
- Create.
- Edit.
- Preview.
- Download PDF.
- Print.
- WhatsApp sharing.

Do not mix delivery challans with tax invoices.

## 16. WHATSAPP BUSINESS INTEGRATION

Integrate the official Meta WhatsApp Business Cloud API.

Features:

1. Send invoice PDF.
2. Send payment receipt PDF.
3. Send outstanding reminders.
4. Send customer ledger PDF.
5. Send account statements.
6. View message history.
7. Retry failed messages.

Create WhatsApp settings with:

- Phone Number ID.
- Business Account ID.
- Access Token.
- API Version.
- Webhook Verification Token.

Store all credentials securely on the server.

Never expose WhatsApp tokens in browser JavaScript.

IMPORTANT:
- Use actual WhatsApp document messages for PDF attachments.
- Do not pretend that a wa.me link automatically sends a PDF.
- If API credentials are unavailable, provide a manual fallback: download PDF and open WhatsApp with a prepared message.
- Track actual message status using webhooks.
- Use approved templates where required.
- Respect customer consent.
- Prevent duplicate sends.

Create a WhatsApp message history page showing:
- Customer.
- Number.
- Message type.
- Date.
- Status.
- Related invoice/receipt.
- Retry action.

## 17. PDF DOCUMENTS

Generate professional PDFs for:

- Tax Invoice.
- Non-GST Invoice.
- Payment Receipt.
- Delivery Challan.
- Customer Ledger.
- Outstanding Statement.

Include:
- Company logo.
- Company details.
- Customer details.
- Document number.
- Date.
- Product table.
- GST breakdown.
- Grand total.
- Payment details.
- Outstanding amount.
- Signature section.

PDFs must work on desktop and mobile.

Generate PDFs from saved database records, not unsaved browser values.

## 18. REPORTS

Create:

- Daily Sales.
- Monthly Sales.
- Yearly Sales.
- Daily Collection.
- Monthly Collection.
- Customer-wise Outstanding.
- Invoice-wise Payments.
- Paid versus Unpaid.
- Product-wise Sales.
- GST Summary.
- Delivery Challan Report.
- WhatsApp Message History.

Export:
- PDF.
- Excel.
- CSV.

Sales and payment collection must be calculated separately.

## 19. SETTINGS

Company settings:
- Company Name.
- Logo.
- Address.
- Mobile.
- Email.
- GSTIN.
- State.
- State Code.

Invoice settings:
- Invoice Prefix.
- Automatic Numbering.
- Starting Number.
- Payment Terms.

GST settings:
- Enable/Disable.
- CGST.
- SGST.
- IGST.
- Custom GST.

Customer portal settings:
- Enable/Disable Login.
- Password Reset.
- Invoice Downloads.
- Ledger Downloads.

WhatsApp settings:
- API Configuration.
- Credentials.
- Webhooks.
- Templates.
- Connection Test.

## 20. DATABASE STRUCTURE

Use Neon PostgreSQL.

Create properly related database tables:

- users
- customers
- products
- invoices
- invoice_items
- invoice_taxes
- payments
- payment_allocations
- delivery_challans
- challan_items
- company_settings
- whatsapp_messages
- whatsapp_webhook_events
- activity_logs
- password_reset_tokens
- customer_notifications

Add:
- Foreign keys.
- Appropriate indexes.
- Unique constraints.
- Database transactions.
- Created and updated timestamps.
- Audit history.

Use server-side pagination and optimized queries.

Never fetch all invoices just to display a dashboard.

## 21. SECURITY

Implement:

- Secure password hashing.
- Secure sessions.
- Role-based authorization.
- Protected server routes.
- Server-side validation.
- Rate limiting.
- Secure password reset.
- Audit logs.
- CSRF protection where applicable.
- Protection against SQL injection.
- Protection against IDOR.
- Secure HTTP-only cookies.

Customer A must never access Customer B's data.

Never trust customer IDs submitted by the browser without checking the authenticated session.

Admin operations must require admin authorization on the server.

## 22. PERFORMANCE

Make the application lightweight and fast.

Implement:
- Server-side pagination.
- Database indexing.
- Optimized SQL queries.
- Debounced search.
- Efficient dashboard aggregation.
- Lazy loading.
- Minimal client-side JavaScript.
- Reusable components.
- Efficient PDF generation.
- Proper loading states.
- Error boundaries.
- Responsive design.

Use caching only for data where stale results cannot cause financial or permission errors.

Avoid unnecessary API calls.

## 23. VERCEL + NEON DEPLOYMENT

The final application must be deployable directly through GitHub and Vercel.

Deployment requirements:

1. Complete Next.js production build.
2. Correct package.json scripts.
3. Neon PostgreSQL connection.
4. Prisma schema and migrations.
5. Vercel-compatible database connection.
6. Correct environment variable configuration.
7. Production-safe authentication.
8. Server-side API routes.
9. Correct PDF generation in the Vercel runtime.
10. No dependency on local development storage.

Provide a complete `.env.example` containing:

DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
NEXTAUTH_URL=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
WHATSAPP_API_VERSION=

Use only the variables required by the chosen authentication and database implementation.

Never put secret credentials in NEXT_PUBLIC variables.

Provide:
- GitHub upload instructions.
- Neon database creation instructions.
- Neon environment variable instructions.
- Vercel project connection instructions.
- Database migration commands.
- Production deployment instructions.
- Admin account creation instructions.

The application must start without requiring me to edit application source code to connect the database. I should only need to configure the documented environment variables and initial admin credentials.

## 24. TESTING AND VALIDATION

Before declaring the project complete, verify:

- Database connection.
- Admin login.
- Customer login.
- Customer data isolation.
- Product creation.
- Bulk product import.
- Invoice creation.
- GST calculations.
- PDF generation.
- Payment allocation.
- Partial payments.
- Outstanding calculations.
- Ledger calculations.
- Customer portal.
- WhatsApp fallback.
- WhatsApp API integration when credentials are available.
- Production build.

Test financial scenarios:

CGST 9% + SGST 9% on ₹10,000 = ₹11,800.

IGST 18% on ₹10,000 = ₹11,800.

Custom CGST 2.5% + SGST 2.5% on ₹10,000 = ₹10,500.

Verify that partial payments update the correct invoice and customer balances.

Do not claim successful deployment, live WhatsApp sending or passing tests without actually verifying them.

## 25. DEVELOPMENT STAGES

Build in this exact order.

**STAGE 1 — FOUNDATION**
- Project setup.
- Dependencies.
- Folder structure.
- Neon database.
- Prisma schema.
- Database migrations.
- Authentication.
- Admin dashboard layout.

**STAGE 2 — MASTER DATA**
- Customer management.
- Product management.
- Bulk CSV import.
- Search and filters.

**STAGE 3 — BILLING**
- Invoice creation.
- Invoice editing.
- GST engine.
- Invoice PDF.
- Invoice numbering.

**STAGE 4 — ACCOUNTING**
- Payment management.
- Partial payments.
- Payment allocation.
- Receipts.
- Customer ledger.
- Outstanding management.

**STAGE 5 — CUSTOMER PORTAL**
- Customer authentication.
- Customer dashboard.
- All bills.
- Paid bills.
- Pending bills.
- Payment history.
- Ledger.
- PDF downloads.

**STAGE 6 — WHATSAPP**
- Meta Cloud API.
- PDF document sending.
- Payment receipts.
- Reminders.
- Webhooks.
- Message history.

**STAGE 7 — ADDITIONAL FEATURES**
- Delivery challans.
- Reports.
- Excel and CSV export.
- Settings.
- Audit logs.

**STAGE 8 — PRODUCTION**
- Security checks.
- Performance optimization.
- Financial tests.
- Production build.
- Vercel deployment instructions.

## 26. FINAL INSTRUCTIONS

Start with STAGE 1.

First provide:
1. Project architecture.
2. Complete folder structure.
3. Exact dependencies.
4. Complete database schema.
5. Neon database setup instructions.
6. Complete initial source files.

Then implement the application stage by stage.

For every stage:
- List completed features.
- List files created or modified.
- Provide complete code.
- Provide exact terminal commands.
- Explain how to connect the implementation to the previous stage.
- Verify the implementation before moving on.

Do not stop after creating a dashboard.

Do not give me only a tutorial or a development plan.

I need actual working source code for the complete MAHADEV CEMENT PRODUCT management system.

When I say CONTINUE, continue the next unfinished development task.

**FINAL GOAL: A complete, secure, fast, production-ready Mahadev Cement Product billing and customer management application, connected to Neon PostgreSQL and deployable on Vercel.**