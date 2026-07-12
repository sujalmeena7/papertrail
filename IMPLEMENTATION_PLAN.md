# PaperTrail — Monetization & Proactive Intelligence Implementation Plan

> **Purpose:** This document is a complete, self-contained implementation spec. It is written to be handed to an AI coding agent (or a developer) and executed phase by phase. Each phase lists exact files, schema changes, business logic, and acceptance criteria.
>
> **Product thesis:** PaperTrail is a SaaS/cloud spend tracker for indie hackers, freelancers, and small startups — people with 15–40 tool subscriptions and no finance team. The existing detection engine (cadence inference, price hikes, zombies, duplicates, redundant tools) is passive: users must open the dashboard to see value. This plan converts it into a proactive product people pay for.

---

## Current Architecture (context for the implementer)

- **Stack:** Next.js (App Router), Drizzle ORM + Neon Postgres, Better Auth (email/password), Tailwind + shadcn/ui, Vercel hosting.
- **Ingestion channels:**
  1. Gmail scan pipeline — `lib/pipeline/*` (prefilter → classify → normalize), triggered via `app/api/scan-worker/route.ts`
  2. Plaid bank sync + receipt reconciliation — `lib/bank/reconcile.ts`, `app/api/plaid/*`
  3. Chrome extension capture via device tokens — `app/api/capture/route.ts`, `app/actions/device-tokens.ts`
- **Detection engine:** `lib/subscriptions/detect.ts` — builds `subscriptions` rows from receipts/transactions, computes `cadence`, `confidence`, `nextExpectedDate`, and writes `subscription_alerts` (types: `price_hike`, `missed_renewal`, `duplicate`, `zombie`).
- **Key tables (in `lib/db/schema.ts`):** `user`, `session`, `account`, `receipts`, `scans`, `gmail_connections`, `device_tokens`, `subscriptions`, `subscription_alerts`, `bank_connections`, `bank_transactions`, `subscription_usage`.
- **Dashboard:** `app/dashboard/*` with components in `components/` and `components/subscriptions/*`.
- **Landing page** has a pricing section (`components/landing/pricing.tsx`) but **no payment processing exists**.

**Known constraint:** `app/api/scan-worker/route.ts` currently requires a browser session (user auth). Scheduled/cron execution requires an internal-auth path (fixed in Phase 0).

---

## Phase Overview & Order

| Phase | Feature | Why this order |
|-------|---------|----------------|
| 0 | Engineering hygiene + cron-safe infrastructure | Everything below depends on it |
| 1 | Proactive renewal alerts (email) | #1 reason users pay |
| 2 | Weekly "money leak" digest email | Retention engine |
| 3 | Stripe billing + plan gating | Turn on revenue |
| 4 | Cancellation playbooks | Converts insight into felt wins |
| 5 | Tax-season export package | Freelancer wedge, annual revenue bump |

Phases 1+2 share infrastructure and should be built together. Phase 3 can be built in parallel by a second agent if desired.

---

## Phase 0 — Hygiene & Cron-Safe Infrastructure

### 0.1 Repo cleanup
- Rename `package.json` `name` from `my-project` to `papertrail`.
- Delete `scratch/` directories and `start_claude.bat` from the repo; add them to `.gitignore`.

### 0.2 Internal-auth for background jobs
Create a shared guard so cron routes can run without a browser session:

- **New file:** `lib/internal-auth.ts`
  - Export `verifyCronAuth(request: Request): boolean` — checks `Authorization: Bearer ${process.env.CRON_SECRET}`.
  - `CRON_SECRET` is a new required env var (generate with `openssl rand -base64 32`).
- Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>` when the `CRON_SECRET` env var is set on the project — no custom wiring needed beyond checking the header.

### 0.3 Refactor scan-worker for background execution
- Extract the core scan logic in `app/api/scan-worker/route.ts` into `lib/pipeline/run-scan.ts` exporting `runScanForUser(userId: string, options)`.
- The route keeps session-based auth for user-triggered scans; the new function is callable from cron routes with an explicit `userId`.

### 0.4 Fix N+1 queries in the detection engine
- In `lib/subscriptions/detect.ts`, replace per-subscription/per-alert lookups inside loops with batched queries:
  - Load all existing active alerts for the user in one query keyed by `(subscriptionId, type)` into a `Map` before the loop.
  - Batch alert inserts with a single `db.insert(subscriptionAlerts).values([...])`.
- Behavior must remain identical (same alerts produced, same dedupe semantics).

### 0.5 Rate-limit the capture endpoint
- In `app/api/capture/route.ts`, add rate limiting per device token: max 60 requests/minute.
- Implementation: simple in-memory sliding window is acceptable for now (single-region deployment); structure it behind a `checkRateLimit(tokenHash: string): boolean` helper in `lib/rate-limit.ts` so it can be swapped for Upstash later.
- Return `429` with `Retry-After` header when exceeded.

### Acceptance criteria (Phase 0)
- `pnpm build` passes.
- A `curl` with `Authorization: Bearer $CRON_SECRET` to a test cron route returns 200; without it, 401.
- Detection run on a user with 20 subscriptions performs O(constant) queries, not O(n).
- 61st capture request in a minute returns 429.

---

## Phase 1 — Proactive Renewal Alerts (Email)

**Goal:** Users receive an email like: *"Figma renews in 3 days for $15/mo. You haven't used it in 94 days. Here's how to cancel."* — without ever opening the dashboard.

### 1.1 Email infrastructure
- **Provider:** Resend (`resend` npm package). New env vars: `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `PaperTrail <alerts@yourdomain.com>`).
- **New file:** `lib/email/client.ts` — thin wrapper `sendEmail({ to, subject, react })` around Resend. All sends go through this file (single choke point for logging + suppression).
- **New file:** `lib/email/templates/` directory using React Email-style JSX components (plain TSX rendered by Resend is fine; do not add heavy dependencies):
  - `renewal-alert.tsx` — single upcoming renewal.
  - Shared `components.tsx` — header/footer/button primitives, consistent branding (use the app's existing color tokens conceptually; emails use inline styles).
- Every email footer must include an unsubscribe/preferences link (see 1.4).

### 1.2 Schema additions (add to `lib/db/schema.ts`, generate a Drizzle migration)

```
notification_preferences
  id            text PK
  userId        text NOT NULL UNIQUE -> user.id (cascade)
  renewalAlertsEnabled     boolean NOT NULL DEFAULT true
  renewalLeadDays          integer NOT NULL DEFAULT 3      -- days before renewal to alert
  annualRenewalLeadDays    integer NOT NULL DEFAULT 14     -- annual plans get longer lead
  weeklyDigestEnabled      boolean NOT NULL DEFAULT true
  digestDayOfWeek          integer NOT NULL DEFAULT 1      -- 0=Sun … 6=Sat
  unsubscribedAll          boolean NOT NULL DEFAULT false
  createdAt / updatedAt    timestamps

sent_notifications
  id            text PK
  userId        text NOT NULL -> user.id (cascade)
  type          text NOT NULL        -- 'renewal_alert' | 'weekly_digest' | 'price_hike' | ...
  dedupeKey     text NOT NULL UNIQUE -- e.g. `renewal:{subscriptionId}:{nextExpectedDate}`
  subscriptionId text NULL -> subscriptions.id (set null)
  sentAt        timestamp NOT NULL DEFAULT now()
  index on (userId, type)
```

`sent_notifications.dedupeKey` is the idempotency mechanism — a renewal alert for the same subscription and same renewal date is sent at most once, even if the cron runs multiple times.

### 1.3 Cron route: renewal alerts
- **New file:** `app/api/cron/renewal-alerts/route.ts` (GET, guarded by `verifyCronAuth`).
- **Logic:**
  1. Query all `subscriptions` where `status = 'active'` and `nextExpectedDate` is within the user's lead window (`renewalLeadDays` for monthly/quarterly, `annualRenewalLeadDays` for annual). Join `user`, `notification_preferences`, and `subscription_usage`.
  2. Skip users with `unsubscribedAll` or `renewalAlertsEnabled = false`.
  3. Skip if a `sent_notifications` row exists for the dedupe key.
  4. Enrich each alert with:
     - Amount and cadence (from subscription row).
     - Zombie context: if `subscription_usage.usageStatus` is `rarely`/`never`, or `lastUsedAt` > 60 days ago, include "You haven't used this in N days."
     - Cancellation playbook link if one exists (Phase 4; link to dashboard subscription row until then).
  5. Group multiple same-day renewals for one user into a single email.
  6. Send via `lib/email/client.ts`, then insert `sent_notifications` rows.
- **Vercel cron config:** add to `vercel.json`:
  ```json
  { "crons": [{ "path": "/api/cron/renewal-alerts", "schedule": "0 14 * * *" }] }
  ```
  (Daily at 14:00 UTC ≈ morning in the US.)

### 1.4 Notification preferences UI + unsubscribe
- **Settings page:** add a "Notifications" card to `app/dashboard/settings/page.tsx` (new component `components/notification-preferences-card.tsx`) with toggles for renewal alerts and weekly digest, lead-day selects, and digest day-of-week select. Server actions in **new file** `app/actions/notifications.ts`.
- **One-click unsubscribe:** signed-token link in email footers → `app/api/email/unsubscribe/route.ts` (GET). Token = HMAC of `userId` using `BETTER_AUTH_SECRET` (reuse `lib/encryption.ts` patterns). Sets `unsubscribedAll = true` and renders a minimal confirmation page.

### Acceptance criteria (Phase 1)
- Subscription with `nextExpectedDate` = today + 3 → user receives one email; re-running the cron sends nothing.
- Annual subscription gets alerted at 14 days lead, monthly at 3 days.
- Zombie subscriptions include the "unused for N days" line.
- Unsubscribe link works without login and suppresses all future sends.

---

## Phase 2 — Weekly "Money Leak" Digest

**Goal:** A weekly email: *"You spent $612 this month, up 14%. 3 zombie subscriptions costing $47/mo. 2 redundant design tools. Upcoming renewals: …"*

### 2.1 Digest data assembly
- **New file:** `lib/email/digest-data.ts` exporting `buildDigestData(userId: string)` returning:
  - `monthlySpendCents` (current calendar month, from `receipts` + unmatched `bank_transactions` flagged as subscriptions), and % change vs. previous month.
  - `activeSubscriptionCount` and total monthly-equivalent spend (annual amortized to monthly).
  - Top 3 undismissed alerts from `subscription_alerts`, ordered by severity then recency.
  - Zombie list with monthly cost sum.
  - Renewals in the next 7 days.
  - Biggest single price hike this month, if any.
- Reuse existing aggregation logic from dashboard components where it exists (check `components/analytics-cards.tsx` and `app/actions/subscriptions.ts` before writing new queries).

### 2.2 Digest email + cron
- **New template:** `lib/email/templates/weekly-digest.tsx` — scannable, numbers-first layout: hero stat (monthly spend + delta), then "Money leaks" section (zombies/duplicates/redundant), then "Upcoming renewals" list, then a single CTA button to the dashboard.
- **New route:** `app/api/cron/weekly-digest/route.ts` (guarded by `verifyCronAuth`).
  - Runs daily; for each user, send only if today matches their `digestDayOfWeek`, `weeklyDigestEnabled`, not `unsubscribedAll`, and dedupe key `digest:{userId}:{isoWeek}` unused.
  - Skip users with zero subscriptions and zero receipts (nothing to report).
- Add to `vercel.json` crons: `{ "path": "/api/cron/weekly-digest", "schedule": "0 15 * * *" }`.

### 2.3 Refresh detection before digesting
- Before building digest data for a user, re-run subscription detection (`lib/subscriptions/detect.ts`) for that user so numbers are fresh. If a Gmail connection exists with valid tokens, optionally run `runScanForUser` first (bounded: skip if `lastScanAt` < 24h ago).

### Acceptance criteria (Phase 2)
- User with data receives one digest on their configured day; never twice in the same ISO week.
- Digest numbers match the dashboard for the same user.
- User with no data receives nothing.

---

## Phase 3 — Stripe Billing & Plan Gating

**Goal:** Free tier = manual + extension capture only. Pro (~$9/mo or $72/yr) = Gmail scans, Plaid bank sync, email alerts/digests, exports.

### 3.1 Stripe setup
- Use the Stripe integration (env vars `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`). Create two prices (monthly, annual) for one "Pro" product — store price IDs in env vars `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`.
- **New file:** `lib/stripe.ts` — Stripe client singleton.

### 3.2 Schema addition

```
billing_customers
  id                   text PK
  userId               text NOT NULL UNIQUE -> user.id (cascade)
  stripeCustomerId     text NOT NULL UNIQUE
  stripeSubscriptionId text NULL
  plan                 text NOT NULL DEFAULT 'free'   -- 'free' | 'pro'
  planStatus           text NOT NULL DEFAULT 'none'   -- 'none' | 'active' | 'past_due' | 'canceled'
  currentPeriodEnd     timestamp NULL
  createdAt / updatedAt timestamps
```

### 3.3 Checkout + portal + webhook
- **New route:** `app/api/billing/checkout/route.ts` (POST, session-authed) — creates/reuses Stripe customer, creates a Checkout Session (subscription mode) for the chosen price, returns URL.
- **New route:** `app/api/billing/portal/route.ts` (POST, session-authed) — Stripe Billing Portal session for plan management/cancellation.
- **New route:** `app/api/billing/webhook/route.ts` — verifies signature with `STRIPE_WEBHOOK_SECRET`; handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` → upserts `billing_customers` (`plan`, `planStatus`, `currentPeriodEnd`). Must use the raw request body for signature verification.

### 3.4 Plan gating
- **New file:** `lib/billing/plan.ts` — `getUserPlan(userId): Promise<'free' | 'pro'>` (treat `past_due` as pro for a 7-day grace period based on `currentPeriodEnd`).
- Gate server-side (never client-only):
  - `app/api/gmail/connect/route.ts` — pro only.
  - `app/api/plaid/create-link-token/route.ts` — pro only.
  - `app/api/export/csv/route.ts` — pro only.
  - Cron email sends (Phases 1–2) — pro only (free users get in-app alerts only).
  - Extension capture and manual receipts remain free.
- Gated endpoints return `403` with `{ error: "upgrade_required" }`; UI catches this and shows an upgrade prompt.

### 3.5 UI
- **New page:** `app/dashboard/billing/page.tsx` — current plan, renewal date, upgrade buttons (monthly/annual), "Manage billing" portal link. New component `components/billing/plan-card.tsx`.
- Update `components/landing/pricing.tsx` to reflect real tiers and link CTAs to sign-up → billing.
- Add lock badges / upgrade prompts on gated features (`components/gmail-card.tsx`, `components/bank-connection-card.tsx`).

### Acceptance criteria (Phase 3)
- Free user hitting Gmail connect gets 403 + upgrade UI; after Stripe test-mode checkout, the same action succeeds.
- Webhook cancellation downgrades the user; grace period honored for `past_due`.
- Webhook signature failures return 400 and change nothing.

---

## Phase 4 — Cancellation Playbooks

**Goal:** Every zombie/renewal alert includes "here's exactly how to cancel" — turning insight into a felt win.

### 4.1 Playbook data
- **New file:** `lib/subscriptions/playbooks.ts` — a static map keyed by normalized vendor (same normalization as `lib/pipeline/normalize.ts` / `lib/subscriptions/vendors.ts`):
  ```ts
  type CancellationPlaybook = {
    vendor: string
    cancelUrl?: string            // direct deep link to the cancel page
    steps: string[]               // exact click-path
    retentionOfferTip?: string    // e.g. "They usually offer 30% off for 3 months — ask."
    refundPolicy?: string         // e.g. "Annual plans: pro-rated refund within 14 days."
    difficulty: 'easy' | 'medium' | 'hard'
  }
  ```
- Seed playbooks for every vendor in `KNOWN_RECURRING_VENDORS` (`lib/subscriptions/vendors.ts`) — at minimum: AWS, Vercel, OpenAI, Anthropic, Supabase, Datadog, Linear, Figma, Notion, Slack, GitHub, Google Workspace, Adobe, Netflix, Spotify. Accuracy matters more than volume; mark uncertain ones `difficulty: 'hard'` with a generic account-settings step.

### 4.2 Surface playbooks
- **Dashboard:** add a "How to cancel" expandable section to the subscription row/detail (`components/subscriptions/subscriptions-table.tsx` and/or `subscription-history-dialog.tsx`) — new component `components/subscriptions/cancellation-playbook.tsx` showing steps, cancel-link button, retention tip, difficulty badge.
- **Alerts:** `components/subscriptions/alerts-list.tsx` — zombie/price-hike alerts get a "Cancel guide" action.
- **Emails:** renewal alerts (Phase 1) and digests (Phase 2) include the `cancelUrl` and top 1–2 steps inline when a playbook exists.
- Track wins: when a user marks a subscription `cancelled` (existing status field), record `savedCents = currentAmountCents × 12 / cadence-months` and show cumulative "Saved with PaperTrail: $X/yr" on the dashboard (extend `components/subscriptions/savings-calculator.tsx` if it fits, else a small stat card).

### Acceptance criteria (Phase 4)
- Every known vendor's subscription row shows a playbook; unknown vendors show a graceful generic fallback.
- Cancelling a subscription updates the "saved" stat.
- Emails include cancel links for known vendors.

---

## Phase 5 — Tax-Season Export Package

**Goal:** A one-click "accountant package": categorized expense CSV + all receipt files zipped, for a chosen year. Pro-gated (or one-time purchase later — keep it plan-gated for v1).

### 5.1 Export API
- **New route:** `app/api/export/tax-package/route.ts` (GET, session-authed, pro-gated, `?year=2026`).
- **Contents (a single ZIP streamed to the client):**
  - `expenses.csv` — QuickBooks-compatible columns: `Date, Vendor, Description, Category, Amount, Currency, Payment Source, Receipt Filename, Invoice Number`. Rows = all `receipts` in the year + `bank_transactions` marked as subscriptions with no matched receipt (flagged `"No receipt on file"`).
  - `receipts/` — every receipt file downloaded from `blobUrl` (Vercel Blob), named `YYYY-MM-DD_vendor_amount.pdf` (or original extension). Skip missing blobs gracefully; note them in the CSV.
  - `summary.txt` — total by category, total deductible estimate, receipt coverage % ("42 of 47 expenses have receipt evidence").
- Use `archiver` or `jszip` (install first) and stream the response; do not buffer everything in memory if avoidable.

### 5.2 UI
- **New component:** `components/tax-export-card.tsx` on the settings page (or a new `app/dashboard/exports/page.tsx` if settings gets crowded): year selector, receipt-coverage stat, "Download accountant package" button, and a note about missing receipts with a link to run a scan.

### Acceptance criteria (Phase 5)
- Downloading the 2026 package yields a valid ZIP with a correct CSV, receipt files, and summary.
- Expenses without receipts appear in the CSV flagged, not silently dropped.
- Free users see the card with an upgrade prompt.

---

## Cross-Cutting Requirements

1. **Security:** All new queries scoped by `userId` (no RLS on Neon — every query filters by session user). Cron routes guarded by `CRON_SECRET`. Stripe webhook signature-verified against raw body. Unsubscribe tokens HMAC-signed. Never log tokens or email addresses with secrets.
2. **Idempotency:** All email sends deduped via `sent_notifications.dedupeKey`. Webhook handlers must be safe to replay.
3. **Migrations:** Every schema change goes through Drizzle migrations (`drizzle-kit generate` + apply), consistent with the repo's existing setup. Never hand-edit applied migrations.
4. **New env vars (document in README):** `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`.
5. **Design consistency:** New UI uses existing shadcn components and the app's design tokens. No new colors/fonts. Emails: clean, numbers-first, single accent color, inline styles.
6. **Testing each phase:** Verify in the browser (dashboard flows) and via `curl` (cron/webhook routes with test payloads) before moving to the next phase. Stripe: use test mode + Stripe CLI webhook forwarding locally.

## Suggested Agent Prompts (one per phase)

- "Implement Phase 0 of IMPLEMENTATION_PLAN.md: hygiene, cron auth, scan-worker refactor, detect.ts batching, capture rate limiting."
- "Implement Phase 1: renewal alert emails with Resend, notification preferences, and the daily cron route, exactly as specified."
- "Implement Phase 2: weekly digest data builder, template, and cron."
- "Implement Phase 3: Stripe checkout, webhook, billing_customers table, and server-side plan gating."
- "Implement Phase 4: cancellation playbooks data + UI + email integration."
- "Implement Phase 5: tax package export (ZIP with CSV, receipts, summary)."
