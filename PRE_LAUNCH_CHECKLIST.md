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

## 1. Verify a real domain in Resend

Currently `EMAIL_FROM` uses Resend's shared test domain (`onboarding@resend.dev`), which only delivers to the email address you signed up to Resend with. Real users won't receive anything until this is fixed.

- Resend dashboard → **Domains** → **Add Domain** → enter a domain you own.
- Add the DNS records (SPF/DKIM) Resend gives you, at your domain registrar.
- Wait for the "Verified" badge.
- Update `.env` (and Vercel env vars, see below):
  ```
  EMAIL_FROM="PaperTrail <alerts@yourdomain.com>"
  ```

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
