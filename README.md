# 📄 Papertrail (subtrace.app)

> **Automated AI-Powered Invoice & Subscription Tracker**  
> Effortlessly parse invoices, monitor recurring SaaS subscriptions, scan Gmail receipts, scrape vendor billing dashboards, and get smart renewal alerts before charges land.

---

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.6-purple?style=for-the-badge)](https://better-auth.com/)

---

## 🌟 Overview

**Papertrail** solves subscription overload and forgotten renewal fees. It automatically captures invoice data from multiple streams—including your Gmail inbox, bank transactions via Plaid, and automated browser scrapers (AWS, Vercel)—and organizes them into a central financial dashboard. 

Using generative AI models (OpenAI & Google Gemini), Papertrail intelligently extracts billing dates, line items, tax details, currency conversion rates, and vendor subscription intervals without requiring manual data entry.

---

## ✨ Key Features

- 🤖 **AI-Driven Invoice Extraction**: Automatically parses unstructured receipt text, PDFs, and HTML emails into structured JSON using Vercel AI SDK (`gpt-4o` & `gemini-pro`).
- 📬 **Gmail Auto-Sync**: OAuth-integrated background inbox scanner to detect and index software receipts instantly.
- 🔌 **Browser Extension Scraper**: Chrome Manifest V3 extension to extract invoice histories from developer platforms (AWS, Vercel, etc.).
- 💳 **Plaid Bank Integration**: Connect bank accounts directly to match real transactions against detected subscriptions.
- 🔔 **Smart Renewal Alerts & Weekly Digests**: Automated Vercel Cron jobs paired with Resend email delivery to notify you before upcoming renewals.
- 🔐 **Modern Auth**: Secure authentication powered by Better Auth, supporting Email OTP verification and Google OAuth 2.0.
- 💰 **Flexible Subscription Billing**: Seamless Razorpay payment gateway integration supporting tiered subscription plans.
- 📊 **Financial Analytics Dashboard**: Visual insights into spending habits, vendor breakdowns, and monthly recurring revenue (MRR) changes.

---

## 🛠 Tech Stack

### Web Application & Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Shadcn UI](https://ui.shadcn.com/)
- **State & Data Fetching**: SWR, React Email

### Backend & Infrastructure
- **Database & ORM**: PostgreSQL, [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Better Auth](https://better-auth.com/) (Email OTP & Google OAuth)
- **AI Pipelines**: Vercel AI SDK ([@ai-sdk/openai](https://www.npmjs.com/package/@ai-sdk/openai), [@ai-sdk/google](https://www.npmjs.com/package/@ai-sdk/google))
- **Email Delivery**: [Resend](https://resend.com/)
- **Payments & Banking**: [Razorpay API](https://razorpay.com/), [Plaid API](https://plaid.com/)
- **Blob Storage**: Vercel Blob

### Browser Extension
- **Manifest**: Chrome Extension Manifest V3
- **Tooling**: Vite, TypeScript, Content Scripts for portal scrapers (AWS, Vercel)

---

## 📂 Project Structure

```bash
papertrail-invoice-scraper/
├── app/                      # Next.js App Router (Pages, API Routes, Layouts)
│   ├── (auth)/               # Auth routes (Sign-in, Sign-up, OTP)
│   ├── api/                  # API endpoints (Cron jobs, Webhooks, AI parser)
│   └── dashboard/            # Protected Dashboard views (Invoices, Subscriptions, Billing)
├── brand/                    # Brand assets, logos, and favicons
├── components/               # React components (UI library, Dashboards, Landing)
│   ├── landing/              # Marketing landing page components
│   ├── subscriptions/        # Subscription radar & tracking UI
│   └── ui/                   # Reusable Shadcn UI primitives
├── drizzle/                  # Database schemas, migrations, and seeds
├── extension/                # Manifest V3 Chrome Extension source code
│   ├── src/content-scripts/  # Portal scrapers (AWS Billing, Vercel Billing)
│   └── src/popup/            # Extension popup user interface
├── fixtures/                 # Sample invoice fixtures for testing AI parser
├── lib/                      # Core backend utilities, AI SDK, Auth & DB config
├── public/                   # Static assets & public images
├── scripts/                  # Helper scripts (Automation & setup tools)
└── .github/workflows/        # GitHub Actions CI/CD workflows
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local system:
- **Node.js**: v20.x or later
- **pnpm**: v11.x (`npm i -g pnpm`)
- **PostgreSQL**: Local instance or hosted database (e.g. Supabase, Neon)

### 1. Clone the Repository

```bash
git clone https://github.com/sujalmeena7/papertrail.git
cd papertrail-invoice-scraper
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root and populate the required environment keys:

```env
# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Database & Storage
DATABASE_URL="postgresql://user:password@localhost:5432/papertrail"
BLOB_READ_WRITE_TOKEN="your_vercel_blob_token"

# Better Auth Configuration
BETTER_AUTH_SECRET="your_random_auth_secret_key"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth (Gmail Scraper & Sign-in)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# AI Models (Vercel AI SDK)
OPENAI_API_KEY="sk-..."
GOOGLE_GENERATIVE_AI_API_KEY="AIzaSy..."

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="Papertrail <noreply@subtrace.app>"

# Payments (Razorpay)
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="your_razorpay_secret"
RAZORPAY_PLAN_ID="plan_..."
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"

# Bank Connection (Plaid)
PLAID_CLIENT_ID="your_plaid_client_id"
PLAID_SECRET="your_plaid_secret"
PLAID_ENV="sandbox" # sandbox, development, or production

# Cron Job Security
CRON_SECRET="your_cron_auth_secret"
```

### 4. Database Setup & Migrations

Push the Drizzle schema to your PostgreSQL database:

```bash
pnpm drizzle-kit push
```

### 5. Run the Local Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

---

## 🧩 Building the Chrome Extension

To build and load the browser scraper extension locally:

1. Navigate to the extension folder and build:
   ```bash
   cd extension
   pnpm install
   pnpm build
   ```
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** in the top right.
4. Click **Load unpacked** and select the `extension/dist` folder.

---

## ⏰ Automated Cron Tasks

Papertrail relies on two scheduled cron jobs configured via `vercel.json`:

- **Renewal Alerts** (`/api/cron/renewal-alerts`): Runs daily at 13:00 UTC to notify users of subscriptions renewing in the next 3 days.
- **Weekly Digest** (`/api/cron/weekly-digest`): Runs every Monday at 13:00 UTC with a summary of financial activity.

You can trigger cron routes manually during local development:
```bash
curl -H "Authorization: Bearer <YOUR_CRON_SECRET>" http://localhost:3000/api/cron/renewal-alerts
```

---

## 📈 Activity & Contribution Automation

This repository includes an automated GitHub Action workflow (`.github/workflows/auto-commit.yml`) to maintain active repository heartbeats.

- **Automated Cloud Schedule**: Runs twice daily on GitHub's servers to append heartbeat telemetry logs.
- **On-Demand Local Script**:
  ```powershell
  .\scripts\boost_commits.ps1 -Count 25
  ```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue for bug reports or feature requests.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p center align="center">
  Built with ❤️ by <a href="https://github.com/sujalmeena7">sujalmeena7</a>
</p>
