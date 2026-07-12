/**
 * Static vendor metadata dictionary.
 *
 * Maps normalized vendor names (lowercase) to enriched metadata:
 *   - category: used for duplicate/redundant tool detection
 *   - cancelUrl: direct link to the vendor's billing/cancel page
 *   - displayName: pretty name for UI rendering
 *
 * In production, this will be replaced by a database-backed lookup
 * with community-sourced contributions (see production scaling brief).
 */

export interface VendorInfo {
  displayName: string
  category: string
  cancelUrl: string | null
}

export const VENDOR_DATA: Record<string, VendorInfo> = {
  // Infrastructure / Cloud
  aws: {
    displayName: "Amazon Web Services",
    category: "Infrastructure",
    cancelUrl: "https://console.aws.amazon.com/billing/home#/account",
  },
  "amazon web services": {
    displayName: "Amazon Web Services",
    category: "Infrastructure",
    cancelUrl: "https://console.aws.amazon.com/billing/home#/account",
  },
  "google cloud": {
    displayName: "Google Cloud",
    category: "Infrastructure",
    cancelUrl: "https://console.cloud.google.com/billing",
  },
  digitalocean: {
    displayName: "DigitalOcean",
    category: "Infrastructure",
    cancelUrl: "https://cloud.digitalocean.com/account/billing",
  },
  vercel: {
    displayName: "Vercel",
    category: "Hosting",
    cancelUrl: "https://vercel.com/account/billing",
  },
  netlify: {
    displayName: "Netlify",
    category: "Hosting",
    cancelUrl: "https://app.netlify.com/user/settings#billing",
  },
  railway: {
    displayName: "Railway",
    category: "Hosting",
    cancelUrl: "https://railway.app/account/billing",
  },
  heroku: {
    displayName: "Heroku",
    category: "Hosting",
    cancelUrl: "https://dashboard.heroku.com/account/billing",
  },
  supabase: {
    displayName: "Supabase",
    category: "Infrastructure",
    cancelUrl: "https://supabase.com/dashboard/org/_/billing",
  },

  // Design
  figma: {
    displayName: "Figma",
    category: "Design",
    cancelUrl: "https://www.figma.com/settings#billing-plan-and-payments",
  },
  framer: {
    displayName: "Framer",
    category: "Design",
    cancelUrl: "https://framer.com/projects/",
  },
  canva: {
    displayName: "Canva",
    category: "Design",
    cancelUrl: "https://www.canva.com/settings/billing",
  },
  adobe: {
    displayName: "Adobe",
    category: "Design",
    cancelUrl: "https://account.adobe.com/plans",
  },
  webflow: {
    displayName: "Webflow",
    category: "Design",
    cancelUrl: "https://webflow.com/dashboard/account/billing",
  },

  // Workspace / Productivity
  notion: {
    displayName: "Notion",
    category: "Workspace",
    cancelUrl: "https://www.notion.so/my-account/plans",
  },
  "google workspace": {
    displayName: "Google Workspace",
    category: "Workspace",
    cancelUrl: "https://admin.google.com/ac/billing",
  },
  slack: {
    displayName: "Slack",
    category: "Workspace",
    cancelUrl: "https://slack.com/intl/en-us/help/articles/218915077",
  },
  linear: {
    displayName: "Linear",
    category: "Project Management",
    cancelUrl: "https://linear.app/settings/billing",
  },
  atlassian: {
    displayName: "Atlassian",
    category: "Project Management",
    cancelUrl: "https://admin.atlassian.com/",
  },

  // Developer Tools
  github: {
    displayName: "GitHub",
    category: "Developer Tools",
    cancelUrl: "https://github.com/settings/billing/summary",
  },
  openai: {
    displayName: "OpenAI",
    category: "AI",
    cancelUrl: "https://platform.openai.com/settings/organization/billing/overview",
  },
  anthropic: {
    displayName: "Anthropic",
    category: "AI",
    cancelUrl: "https://console.anthropic.com/settings/billing",
  },
  stripe: {
    displayName: "Stripe",
    category: "Payments",
    cancelUrl: "https://dashboard.stripe.com/settings/billing",
  },
  datadog: {
    displayName: "Datadog",
    category: "Monitoring",
    cancelUrl: "https://app.datadoghq.com/billing/plan",
  },
  sentry: {
    displayName: "Sentry",
    category: "Monitoring",
    cancelUrl: "https://sentry.io/settings/billing/",
  },
  cloudflare: {
    displayName: "Cloudflare",
    category: "Infrastructure",
    cancelUrl: "https://dash.cloudflare.com/?account=billing",
  },

  // Security & Identity
  "1password": {
    displayName: "1Password",
    category: "Security",
    cancelUrl: "https://my.1password.com/settings/billing",
  },

  // Communication
  zoom: {
    displayName: "Zoom",
    category: "Communication",
    cancelUrl: "https://zoom.us/billing",
  },

  // Writing
  grammarly: {
    displayName: "Grammarly",
    category: "Writing",
    cancelUrl: "https://account.grammarly.com/subscription",
  },

  // Storage
  dropbox: {
    displayName: "Dropbox",
    category: "Storage",
    cancelUrl: "https://www.dropbox.com/account/plan",
  },

  // Domains
  namecheap: {
    displayName: "Namecheap",
    category: "Domains",
    cancelUrl: "https://ap.www.namecheap.com/dashboard",
  },

  // Entertainment (common consumer subs)
  spotify: {
    displayName: "Spotify",
    category: "Entertainment",
    cancelUrl: "https://www.spotify.com/account/subscription/",
  },
  netflix: {
    displayName: "Netflix",
    category: "Entertainment",
    cancelUrl: "https://www.netflix.com/cancelplan",
  },
  hulu: {
    displayName: "Hulu",
    category: "Entertainment",
    cancelUrl: "https://secure.hulu.com/account",
  },

  // Microsoft
  microsoft: {
    displayName: "Microsoft",
    category: "Workspace",
    cancelUrl: "https://account.microsoft.com/services/",
  },
}

/**
 * Look up vendor metadata by normalized vendor name.
 * Returns undefined if the vendor is not in our dictionary.
 */
export function getVendorInfo(vendorNormalized: string): VendorInfo | undefined {
  return VENDOR_DATA[vendorNormalized.toLowerCase()]
}

/**
 * Get the cancel URL for a vendor, or null if unknown.
 */
export function getCancelUrl(vendorNormalized: string): string | null {
  return getVendorInfo(vendorNormalized)?.cancelUrl ?? null
}

/**
 * Get the category for a vendor, or "Uncategorized" if unknown.
 */
export function getVendorCategory(vendorNormalized: string): string {
  return getVendorInfo(vendorNormalized)?.category ?? "Uncategorized"
}
