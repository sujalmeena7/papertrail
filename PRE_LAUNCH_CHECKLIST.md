# Pre-Launch Checklist

Things that work fine in local dev but must be done before this app is live for real users.

## Status as of 2026-07-14

The app is deployed to Vercel (production URL live), and the following are done:
- Email OTP verification on sign-up (Better Auth `emailOTP` plugin) — shipped and committed (`2340687`).
- Dedicated `/dashboard/billing` page with full plan comparison — shipped and committed.
- Sign-out bug fixed, upgrade dialog restyled + centering bug fixed — shipped and committed.
- Real Razorpay live keys, plan, and webhook are set up (confirmed with user 2026-07-14) — `RAZORPAY_KEY_ID`,
  `RAZORPAY_KEY_SECRET`, `RAZORPAY_PLAN_ID` are live values, webhook already created in Razorpay dashboard.

Note: these vars are marked **Sensitive** in Vercel, which blanks their value on every read-back (CLI `vercel env
pull`, dashboard, API) — that's expected and correct, not a sign they're missing. Don't re-diagnose "empty" env
vars from a `vercel env pull` result; a Sensitive var reads back as `""` even when it's set correctly. If you
need to confirm a value is real, check with the user or trigger the actual flow (e.g. a test webhook) instead.

## 1. Verify a real domain in Resend — DONE (2026-07-16)

`subtrace.app` is verified in Resend and `EMAIL_FROM="Papertrail <noreply@subtrace.app>"` is live in both
`.env` and Vercel production. OTP and alert emails now deliver to any real address (previously the shared
`onboarding@resend.dev` sender only delivered to the Resend account owner's own inbox).

⚠️ Reminder: saving an env var in Vercel does NOT update the running deployment — a redeploy is required for a
new `EMAIL_FROM`/`RESEND_API_KEY` value to take effect.

<details>
<summary>Original setup steps (for reference)</summary>

- Resend dashboard → **Domains** → **Add Domain** → enter a domain you own.
- Add the DNS records (SPF/DKIM) Resend gives you, at your domain registrar.
- Wait for the "Verified" badge.
- Update `.env` (and Vercel env vars, see below):
  ```
  EMAIL_FROM="PaperTrail <alerts@yourdomain.com>"
  ```
</details>

## 2. Deploy to Vercel

`vercel.json` already has the cron config:
```json
{
  "crons": [
    { "path": "/api/cron/renewal-alerts", "schedule": "0 13 * * *" },
    { "path": "/api/cron/weekly-digest", "schedule": "0 13 * * 1" }
  ]
}
```
This does nothing until the project is actually deployed to Vercel — crons only register/run on a live deployment (and typically only fire against Production, not preview deployments).

## 3. Set real env vars in Vercel project settings

`.env` is local only — it does not reach the deployed app. Add these in Vercel's project **Settings → Environment Variables** (Production):

- `RESEND_API_KEY` — real key from Resend dashboard. Still needed: confirm this is a real (non-sandbox) key once a domain is verified in step 1.
- `EMAIL_FROM` — must match the domain verified in step 1.
- `CRON_SECRET` — a real random secret (`openssl rand -hex 32`). Vercel's own Cron Jobs feature automatically sends `Authorization: Bearer $CRON_SECRET` using whatever value is set here, so it must match what `verifyCronAuth` (`lib/internal-auth.ts`) checks against. (Already set with a real value in Vercel.)
- All the other existing `.env` vars (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`/`SECRET`, `ENCRYPTION_KEY`, etc.) — already present in Vercel with real values.

## After deploying

Manually trigger each cron route once against production to confirm it works before waiting for the schedule:
```
curl -H "Authorization: Bearer <real CRON_SECRET>" https://<your-domain>/api/cron/renewal-alerts
curl -H "Authorization: Bearer <real CRON_SECRET>" https://<your-domain>/api/cron/weekly-digest
```

## 4. Razorpay billing (Phase 3)

**Done as of 2026-07-14**: live `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` generated, live Plan created (`plan_TD5lmrapS6ZtGS`, ₹999/month), webhook created in Razorpay dashboard, and all corresponding Vercel production env vars set by the user. The account is currently **INR-only** (international payments pending approval), so the Plan is in INR; the UI shows the USD-equivalent price (`lib/billing/pricing.ts`).

Remaining:
- Confirm `RAZORPAY_WEBHOOK_SECRET` in Vercel matches the secret shown for the webhook in the Razorpay dashboard (not independently verified — Vercel Sensitive vars can't be read back to confirm).
- Test the flow once with a real card in live mode (small real charge) — confirm `billing.status` flips to `active` in the DB after the webhook fires, and Pro features unlock.
- When international payments are approved: create a USD Plan in Razorpay, swap `RAZORPAY_PLAN_ID` in Vercel to its id, and update the `usd`/`inrNote` copy in `lib/billing/pricing.ts`. No other code changes needed.

⚠️ Do not add live Razorpay keys to the committed `.env` file — it's tracked in git. Use Vercel env vars only.

## 5. Google OAuth verification for Gmail (BLOCKER for public users)

**Symptom:** signing in / connecting Gmail with any account that isn't a registered test user shows
`Access blocked: papertrail-invoice.vercel.app has not completed the Google verification process` →
`Error 403: access_denied`. This is a Google Cloud console configuration state, NOT an app bug.

**Why:** the OAuth consent screen is in **Testing** mode, so only explicitly-added test users can authorize.
On top of that, Gmail reading uses the **`gmail.readonly`** scope, which Google classifies as a **restricted**
scope — so before *any* non-test user can connect, the app must pass Google's full verification (including a
CASA security assessment).

### Interim (works today, free) — add test users
Google Cloud Console → **APIs & Services → OAuth consent screen** (newer console: **Google Auth Platform →
Audience**) → **Test users** → **+ Add users** → add every Gmail you test with. Limit 100. Takes effect within
a minute. Use this while still building.

### Before public launch — verify + publish (do NOT skip, or real users can't connect Gmail)
1. Fill out the OAuth consent screen completely: app name, logo, homepage URL (`https://subtrace.app`),
   **authorized domain** (`subtrace.app`), and the hosted **privacy policy** (`https://subtrace.app/privacy`)
   + **terms** (`https://subtrace.app/terms`) URLs. All of these pages are live as of 2026-08-11.
2. Set publishing status → **In production**.
3. **Submit for verification.** Because `gmail.readonly` is restricted, this triggers a **security assessment
   (CASA)** — can take multiple weeks and may cost money. Start this well ahead of launch; it is the
   longest-lead-time item on this checklist.

Deferred until the user explicitly decides to start it. Same item as the "Google OAuth verification for
`gmail.readonly`" note in project memory.

**Section 6 (custom domain) is DONE — this is now unblocked.** `subtrace.app` is live, and the pages Google
requires are up: `https://subtrace.app/privacy`, `/terms`, `/security`. Set the consent screen's home page,
privacy policy, terms, and authorized domain to `subtrace.app` (not the Vercel domain) before submitting.

### Pre-submission fixes done 2026-08-11 (commit `09b6183`)

Two things a CASA assessor would have failed the app on, both now live:

1. **OpenAI was an undisclosed subprocessor.** `lib/pipeline/classify.ts` sends the sender, subject, date,
   attachment names, and the first 6,000 chars of each candidate email body to the OpenAI API for field
   extraction. The policy only claimed Google data isn't used to train AI models — true, but silent about the
   transfer itself. `/privacy` now has an **Automated extraction (AI processing)** section naming OpenAI and
   stating what is sent, plus a complete subprocessor list (Neon, Vercel, OpenAI, Resend, Razorpay, Plaid)
   replacing the old vague "such as" sentence. **If a new third party ever touches email content, this list
   must be updated in the same commit** — that's the disclosure Google checks.
2. **Disconnect didn't revoke.** `disconnectGmail()` deleted the token row but never called Google, so the app
   stayed on the user's Google permissions page. `deleteAccount()` had the same gap. Both now call
   `revokeGmailAccess()` (`lib/gmail/revoke.ts`) first — best effort, never throws, so a Google outage can't
   block a local disconnect. Note this revokes the whole grant for the OAuth client, so a user who also signs
   in with Google may see the consent screen again on their next sign-in. Expected.

Remaining before submitting: update consent-screen branding to `subtrace.app`, verify domain ownership in
Search Console, record the demo video (the disconnect shot now genuinely shows the app disappearing from
Google's permissions page), submit.

## 6. Cut over to the custom domain `subtrace.app` — DONE (2026-08-11)

`https://subtrace.app` is live and is now the canonical origin. Verified after cutover: sign-up + OTP email,
Google sign-in, and Gmail connect all working on the new domain.

**How it is wired.** Every absolute URL — Better Auth `baseURL` + `trustedOrigins`, the Gmail OAuth
`redirect_uri`, and links in outbound email — resolves through `getAppUrl()` in `lib/app-url.ts`, which reads
**`BETTER_AUTH_URL`**. Previously the Gmail redirect URI was derived from the incoming request's host, so it
silently changed depending on which hostname the user arrived on; it is now pinned to the canonical origin.

**Final state:**

- **DNS** — registrar is Spaceship, nameservers `launch1/launch2.spaceship.net`. A record `@` →
  `216.198.79.1` (Vercel's current apex IP; the legacy `76.76.21.21` also still works). Nameservers were
  deliberately NOT moved to Vercel — the Resend DKIM/SPF/DMARC records live on Spaceship, and moving them
  would break outbound email until every record was recreated.
- **Vercel** — `subtrace.app` and `papertrail-invoice.vercel.app` both attached to Production. Apex is
  canonical; the "redirect apex to www" option was declined.
- **`BETTER_AUTH_URL`** — `https://subtrace.app`, **Production only** (Preview left unset so preview deploys
  keep resolving to their own generated URL).
- **Google OAuth client** — JS origin `https://subtrace.app`; redirect URIs
  `https://subtrace.app/api/gmail/callback` and `https://subtrace.app/api/auth/callback/google`. The old
  `papertrail-invoice.vercel.app` URIs were **deleted**, so OAuth no longer works on the Vercel domain even
  though it still serves the app. Test only on `subtrace.app`.

**Known gaps, both intentional:**

- `www.subtrace.app` does not exist in DNS — typing it gives "site can't be reached". Apex-only was a
  deliberate choice. To add later: attach `www.subtrace.app` in Vercel as a **308 redirect to
  `subtrace.app`** (not "connect to environment", which would serve it as a second independent host), then
  add the `CNAME www → cname.vercel-dns.com` record at Spaceship. Both halves are required.
- `PRODUCTION_ORIGINS` in `lib/auth.ts` still lists `https://papertrail-invoice.vercel.app`. Harmless — it
  only widens the trusted-origin set — but it can be dropped once the Vercel domain is fully retired.

**Still pointing at the old domain — check before launch:** the Razorpay webhook was moved by the user on
2026-08-11 to `https://subtrace.app/api/billing/webhook` and verified rejecting unsigned and bad-signature
POSTs with `401 Invalid signature`. (That proves the route validates; it does not prove
`RAZORPAY_WEBHOOK_SECRET` in Vercel matches Razorpay's — only a real event does that.)

Existing sessions issued on the Vercel domain did not carry over — cookies are host-scoped, so everyone
signed in at cutover was signed out once. Expected, not a bug.
