# Pre-Launch Checklist

Things that work fine in local dev but must be done before this app is live for real users.

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

- `RESEND_API_KEY` — real key from Resend dashboard
- `EMAIL_FROM` — must match the domain verified in step 1
- `CRON_SECRET` — a real random secret (`openssl rand -hex 32`). Vercel's own Cron Jobs feature automatically sends `Authorization: Bearer $CRON_SECRET` using whatever value is set here, so it must match what `verifyCronAuth` (`lib/internal-auth.ts`) checks against.
- All the other existing `.env` vars (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`/`SECRET`, `ENCRYPTION_KEY`, etc.) also need to be added to Vercel — they're currently only local.

## After deploying

Manually trigger each cron route once against production to confirm it works before waiting for the schedule:
```
curl -H "Authorization: Bearer <real CRON_SECRET>" https://<your-domain>/api/cron/renewal-alerts
curl -H "Authorization: Bearer <real CRON_SECRET>" https://<your-domain>/api/cron/weekly-digest
```

## 4. Razorpay billing (Phase 3)

`.env` only has placeholder Razorpay values — real billing does not work until this is done. The account is currently **INR-only** (international payments pending approval), so the Plan below is created in INR; the UI shows the USD-equivalent price (`lib/billing/pricing.ts`).

- Razorpay dashboard → switch out of test mode when ready → **Subscriptions → Plans → Create Plan**: recurring, INR, ₹999/month. Copy the Plan id.
- Razorpay dashboard → **Settings → API Keys** → generate live `Key Id` / `Key Secret`.
- Razorpay dashboard → **Settings → Webhooks** → add endpoint `https://<your-domain>/api/billing/webhook`, subscribe to `subscription.activated`, `subscription.charged`, `subscription.pending`, `subscription.halted`, `subscription.cancelled`, `subscription.completed`. Copy the webhook secret.
- Set these in Vercel **Settings → Environment Variables** (Production):
  - `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — live keys from above
  - `RAZORPAY_WEBHOOK_SECRET` — from the webhook you just created
  - `RAZORPAY_PLAN_ID` — the live Plan id
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID` — same value as `RAZORPAY_KEY_ID` (this one is exposed client-side by design, used by Checkout.js)
- Test the flow once with a real card in live mode (small real charge) — confirm `billing.status` flips to `active` in the DB after the webhook fires, and Pro features unlock.
- When international payments are approved: create a USD Plan in Razorpay, swap `RAZORPAY_PLAN_ID` in Vercel to its id, and update the `usd`/`inrNote` copy in `lib/billing/pricing.ts`. No other code changes needed.

⚠️ Do not add live Razorpay keys to the committed `.env` file — it's tracked in git. Use Vercel env vars only.
