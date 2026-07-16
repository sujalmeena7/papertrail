/**
 * Static, hand-authored cancellation playbooks.
 *
 * Keyed by the SAME normalized vendor names used in `vendors.ts` (VENDOR_DATA),
 * so a subscription's `cancelUrl` (from vendors.ts) lines up with its playbook here.
 *
 * Every lookup is guaranteed to return a playbook: unknown vendors fall back to
 * GENERIC_PLAYBOOK. Cancel URLs are NOT duplicated here — look them up via
 * getCancelUrl() from vendors.ts.
 *
 * Difficulty reflects how hard the vendor makes it to actually cancel:
 *   easy   — self-serve, a couple of clicks, no retention friction
 *   medium — self-serve but buried, or a soft retention offer to decline
 *   hard   — phone/chat only, aggressive retention, or intentionally obscured
 */

export type CancellationDifficulty = "easy" | "medium" | "hard"

export interface CancellationPlaybook {
  difficulty: CancellationDifficulty
  estimatedMinutes: number
  steps: string[]
  /** Shown as an amber "retention trap" callout when present. */
  retentionWarning?: string
  /** True when cancellation requires phone/chat/email, not just clicks. */
  requiresContact?: boolean
}

export const GENERIC_PLAYBOOK: CancellationPlaybook = {
  difficulty: "medium",
  estimatedMinutes: 5,
  steps: [
    "Log into your account on the vendor's website (use a desktop browser — some cancel flows are hidden on mobile).",
    "Open Settings, then look for Billing, Subscription, or Plan.",
    "Choose Cancel, Downgrade to Free, or Turn off auto-renew.",
    "Complete any confirmation prompts — cancellation often isn't final until the last screen.",
    "Screenshot or save the confirmation email as proof.",
  ],
  retentionWarning:
    "Many services show a discount or 'pause' offer right before the final confirm. Decline it if you want to fully cancel — accepting usually keeps the subscription active.",
}

export const CANCELLATION_PLAYBOOKS: Record<string, CancellationPlaybook> = {
  // ── Infrastructure / Cloud ──
  aws: {
    difficulty: "hard",
    estimatedMinutes: 15,
    steps: [
      "Delete or stop all running resources first (EC2, RDS, S3, etc.) — closing the account won't stop charges from active services.",
      "Go to the Billing console and confirm there are no pending charges.",
      "Open Account settings from the top-right menu.",
      "Scroll to 'Close Account', read the warnings, and confirm.",
      "Expect access to continue for a short grace period; final charges settle on your next billing date.",
    ],
    retentionWarning:
      "Closing the account does NOT auto-terminate resources. Any instance or storage you leave running keeps billing. Tear those down first.",
  },
  "amazon web services": {
    difficulty: "hard",
    estimatedMinutes: 15,
    steps: [
      "Delete or stop all running resources first (EC2, RDS, S3, etc.) — closing the account won't stop charges from active services.",
      "Go to the Billing console and confirm there are no pending charges.",
      "Open Account settings from the top-right menu.",
      "Scroll to 'Close Account', read the warnings, and confirm.",
      "Expect access to continue for a short grace period; final charges settle on your next billing date.",
    ],
    retentionWarning:
      "Closing the account does NOT auto-terminate resources. Any instance or storage you leave running keeps billing. Tear those down first.",
  },
  "google cloud": {
    difficulty: "hard",
    estimatedMinutes: 12,
    steps: [
      "Shut down or delete active projects and resources so nothing keeps billing.",
      "Open the Billing section of the Cloud Console.",
      "Select the billing account, then 'Close billing account'.",
      "Confirm — you may need to settle any outstanding balance first.",
    ],
    retentionWarning:
      "Disabling billing on a project can break live services immediately. Make sure nothing in production still depends on it before you close.",
  },
  digitalocean: {
    difficulty: "medium",
    estimatedMinutes: 8,
    steps: [
      "Destroy all Droplets, databases, and volumes so they stop accruing charges.",
      "Open Settings → Billing.",
      "Pay any outstanding balance.",
      "Use 'Deactivate account' at the bottom of the account settings.",
    ],
    retentionWarning:
      "Resources bill by the hour even after you stop using them. Destroy every Droplet and volume before deactivating.",
  },
  vercel: {
    difficulty: "easy",
    estimatedMinutes: 3,
    steps: [
      "Open your account (or team) Settings → Billing.",
      "Under Plan, choose 'Downgrade to Hobby' (or cancel the Pro plan).",
      "Confirm the downgrade — it takes effect at the end of the current billing cycle.",
    ],
  },
  netlify: {
    difficulty: "easy",
    estimatedMinutes: 3,
    steps: [
      "Go to User settings → Billing.",
      "Select your paid plan and choose to downgrade to Starter/Free.",
      "Confirm — you keep paid features until the cycle ends.",
    ],
  },
  railway: {
    difficulty: "easy",
    estimatedMinutes: 3,
    steps: [
      "Open Account → Billing.",
      "Cancel the subscription or downgrade to the free tier.",
      "Remove or pause any active services so usage-based charges stop.",
    ],
  },
  heroku: {
    difficulty: "medium",
    estimatedMinutes: 6,
    steps: [
      "Scale down or delete dynos and remove paid add-ons (add-ons bill separately).",
      "Open Account settings → Billing.",
      "Remove the paid plan / delete the app.",
    ],
    retentionWarning:
      "Paid add-ons keep billing even after you scale dynos to zero. Remove each add-on explicitly.",
  },
  supabase: {
    difficulty: "medium",
    estimatedMinutes: 6,
    steps: [
      "Open your organization's Billing settings.",
      "Downgrade the org to the Free plan, or pause/delete the project.",
      "Confirm — compute charges stop once the project is paused or downgraded.",
    ],
  },
  cloudflare: {
    difficulty: "medium",
    estimatedMinutes: 5,
    steps: [
      "Open the dashboard and select the relevant domain or account.",
      "Go to the subscription/billing area for that product.",
      "Cancel each paid subscription individually (Workers, Images, etc. bill separately).",
    ],
    retentionWarning:
      "Cloudflare bills each product separately. Cancelling one plan does not cancel the others — check every subscribed product.",
  },

  // ── Design ──
  figma: {
    difficulty: "medium",
    estimatedMinutes: 5,
    steps: [
      "Open the workspace admin, then Settings → Billing.",
      "Choose to downgrade the plan to Starter/Free.",
      "Note: Figma bills per editor seat — remove or downgrade seats you no longer need.",
      "Confirm the change before the next renewal date.",
    ],
    retentionWarning:
      "Figma charges per editor seat and may prorate mid-cycle seat changes. Remove extra editors to avoid a surprise final charge.",
  },
  framer: {
    difficulty: "easy",
    estimatedMinutes: 3,
    steps: [
      "Open the project or account settings.",
      "Go to Plans / Billing.",
      "Downgrade to the free plan and confirm.",
    ],
  },
  canva: {
    difficulty: "easy",
    estimatedMinutes: 3,
    steps: [
      "Open Settings → Billing & plans.",
      "Select 'Cancel subscription'.",
      "Decline the retention offer and confirm — you keep Pro until the period ends.",
    ],
    retentionWarning:
      "Canva usually offers a free extension or discount when you cancel. Accepting it keeps you subscribed.",
  },
  adobe: {
    difficulty: "hard",
    estimatedMinutes: 12,
    steps: [
      "Go to account.adobe.com → Plans → Manage plan.",
      "Select 'Cancel your plan'.",
      "Be ready for an early-termination fee if you're on an annual plan paid monthly.",
      "Push through the retention offers to the final confirmation.",
    ],
    retentionWarning:
      "Adobe's annual-paid-monthly plans charge a hefty early-cancellation fee (roughly 50% of the remaining term). Check your plan type before confirming.",
  },
  webflow: {
    difficulty: "medium",
    estimatedMinutes: 5,
    steps: [
      "Note that site plans and account (workspace) plans are billed separately.",
      "Open the Dashboard → Account → Billing for the workspace plan, and each site's settings for site plans.",
      "Cancel or downgrade each one you no longer need.",
    ],
    retentionWarning:
      "A Webflow site plan and workspace plan are two separate charges. Cancelling one leaves the other active.",
  },

  // ── Workspace / Productivity ──
  notion: {
    difficulty: "easy",
    estimatedMinutes: 3,
    steps: [
      "Open Settings & members → Plans (or Billing).",
      "Choose 'Change plan' or 'Cancel plan' and pick Free.",
      "Confirm — paid features stay until the end of the cycle.",
    ],
  },
  "google workspace": {
    difficulty: "medium",
    estimatedMinutes: 8,
    steps: [
      "Open the Admin console → Billing → Subscriptions.",
      "Select your subscription and choose 'Cancel subscription'.",
      "Export any data you need first — mailboxes and Drive files are deleted after cancellation.",
    ],
    retentionWarning:
      "Cancelling deletes user mailboxes and Drive data after a short grace period. Export everything important before you confirm.",
  },
  slack: {
    difficulty: "medium",
    estimatedMinutes: 5,
    steps: [
      "As a workspace owner, open workspace admin → Billing.",
      "Choose 'Cancel' / downgrade to the Free plan.",
      "Confirm — Slack typically credits unused prepaid time as a prorated refund.",
    ],
  },
  linear: {
    difficulty: "easy",
    estimatedMinutes: 3,
    steps: [
      "Open workspace Settings → Billing.",
      "Downgrade to the Free plan or cancel the subscription.",
      "Confirm before the next renewal.",
    ],
  },
  atlassian: {
    difficulty: "medium",
    estimatedMinutes: 8,
    steps: [
      "Open admin.atlassian.com → Billing → Manage subscriptions.",
      "Find each product (Jira, Confluence, etc.) — they bill separately.",
      "Cancel each subscription you no longer want.",
    ],
    retentionWarning:
      "Atlassian bills each product separately. Cancelling Jira does not cancel Confluence — review every product.",
  },
  microsoft: {
    difficulty: "medium",
    estimatedMinutes: 5,
    steps: [
      "Go to account.microsoft.com → Services & subscriptions.",
      "Find the subscription and select 'Manage' → 'Cancel subscription' (or turn off recurring billing).",
      "Confirm — turning off recurring billing lets it lapse at period end.",
    ],
  },

  // ── Developer Tools / AI / Monitoring ──
  github: {
    difficulty: "easy",
    estimatedMinutes: 3,
    steps: [
      "Open Settings → Billing and plans.",
      "Under your plan, choose 'Downgrade to Free'.",
      "Also review paid add-ons (Copilot, Actions minutes, storage) and cancel them separately.",
    ],
    retentionWarning:
      "Copilot and extra Actions/storage are separate line items. Downgrading your plan doesn't cancel them.",
  },
  openai: {
    difficulty: "medium",
    estimatedMinutes: 4,
    steps: [
      "For ChatGPT Plus: open Settings → Subscription → 'Cancel subscription'.",
      "For API usage: set a usage limit of $0 or remove your payment method in the Billing settings.",
      "Confirm — access continues until the paid period ends.",
    ],
  },
  anthropic: {
    difficulty: "medium",
    estimatedMinutes: 4,
    steps: [
      "For Claude Pro: open Settings → Billing → cancel the subscription.",
      "For API: remove the payment method or set a spend limit in the Console billing settings.",
      "Confirm — you keep access through the current cycle.",
    ],
  },
  stripe: {
    difficulty: "easy",
    estimatedMinutes: 3,
    steps: [
      "Open Settings → Billing (your Stripe account's own subscription, if any).",
      "Cancel the plan or remove paid features you no longer need.",
    ],
  },
  datadog: {
    difficulty: "hard",
    estimatedMinutes: 10,
    steps: [
      "Open Plan & Usage in the account settings.",
      "Reduce hosts/features, or select the option to cancel.",
      "Datadog often requires contacting your account rep to fully cancel an annual commitment — email billing/support to confirm.",
    ],
    retentionWarning:
      "Annual Datadog contracts usually can't be self-cancelled and may auto-renew. Email their billing team well before the renewal date.",
    requiresContact: true,
  },
  sentry: {
    difficulty: "easy",
    estimatedMinutes: 3,
    steps: [
      "Open Settings → Subscription (or Billing).",
      "Choose 'Cancel subscription' or downgrade to the Developer/Free plan.",
      "Confirm before renewal.",
    ],
  },

  // ── Security & Identity ──
  "1password": {
    difficulty: "medium",
    estimatedMinutes: 5,
    steps: [
      "Sign in on 1password.com and open the account/team billing settings.",
      "Choose to cancel the subscription.",
      "Export your vault data before the account is deactivated if you're leaving entirely.",
    ],
    retentionWarning:
      "Once the subscription ends you can lose access to your vaults. Export or migrate your passwords first.",
  },

  // ── Communication ──
  zoom: {
    difficulty: "medium",
    estimatedMinutes: 5,
    steps: [
      "Open zoom.us → Account Management → Billing.",
      "Under Current Plans, click 'Cancel Subscription' for each paid plan/add-on.",
      "Confirm — the plan stays active until the end of the term you've paid for.",
    ],
    retentionWarning:
      "Zoom add-ons (extra cloud storage, Large Meeting, etc.) cancel separately from the base plan.",
  },

  // ── Writing ──
  grammarly: {
    difficulty: "medium",
    estimatedMinutes: 4,
    steps: [
      "Sign in and open account.grammarly.com → Subscription.",
      "Select 'Cancel Subscription'.",
      "Decline the discount offer and complete the confirmation.",
    ],
    retentionWarning:
      "Grammarly typically offers a steep discount when you try to cancel. Accepting it renews the subscription.",
  },

  // ── Storage ──
  dropbox: {
    difficulty: "medium",
    estimatedMinutes: 4,
    steps: [
      "Open dropbox.com → account avatar → Settings → Plan.",
      "Choose 'Cancel plan' and downgrade to Basic/Free.",
      "Reduce your stored files below the free limit to avoid access issues.",
    ],
    retentionWarning:
      "Dropbox may offer a free month or discount at the cancel screen — accepting it keeps you on the paid plan.",
  },

  // ── Domains ──
  namecheap: {
    difficulty: "medium",
    estimatedMinutes: 5,
    steps: [
      "Sign in and open the Dashboard.",
      "For each product, turn OFF auto-renew (Domain List → Manage → Auto-Renew toggle).",
      "For hosting/other subscriptions, open the relevant product and disable renewal.",
    ],
    retentionWarning:
      "Domains and hosting each have their own auto-renew toggle. Turn off every one you don't want to renew.",
  },

  // ── Entertainment ──
  spotify: {
    difficulty: "easy",
    estimatedMinutes: 3,
    steps: [
      "Go to spotify.com/account → 'Available plans' or 'Manage your plan'.",
      "Select 'Cancel Premium'.",
      "Confirm — Premium stays active until the end of the paid month, then reverts to Free.",
    ],
    retentionWarning:
      "Spotify may offer a discounted month to stay. Skip it to actually cancel.",
  },
  netflix: {
    difficulty: "easy",
    estimatedMinutes: 2,
    steps: [
      "Go to netflix.com/cancelplan (or Account → 'Cancel Membership').",
      "Click 'Finish Cancellation'.",
      "You keep access until the end of the current billing period.",
    ],
  },
  hulu: {
    difficulty: "medium",
    estimatedMinutes: 4,
    steps: [
      "Open Account on secure.hulu.com.",
      "Under 'Your Subscription', choose 'Cancel'.",
      "Decline the pause/discount offer and confirm cancellation.",
    ],
    retentionWarning:
      "Hulu pushes a 'pause instead' option and discounts. Choose Cancel, not Pause, to stop billing.",
  },
}

/**
 * Look up a cancellation playbook by normalized vendor name.
 * Always returns a playbook — falls back to GENERIC_PLAYBOOK for unknown vendors.
 */
export function getPlaybook(vendorNormalized: string): CancellationPlaybook {
  return CANCELLATION_PLAYBOOKS[vendorNormalized.toLowerCase()] ?? GENERIC_PLAYBOOK
}
