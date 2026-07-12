// Vendor name normalization so "Amazon Web Services", "AWS", and
// "amazon web services, inc." all group together in analytics.

const VENDOR_ALIASES: Record<string, string> = {
  "amazon web services": "aws",
  "amazon web services inc": "aws",
  "aws emea": "aws",
  "openai llc": "openai",
  "openai inc": "openai",
  "chatgpt": "openai",
  "google cloud platform": "google cloud",
  "google cloud emea": "google cloud",
  "gcp": "google cloud",
  "google workspace": "google workspace",
  "vercel inc": "vercel",
  "stripe inc": "stripe",
  "stripe payments": "stripe",
  "figma inc": "figma",
  "notion labs": "notion",
  "notion labs inc": "notion",
  "github inc": "github",
  "microsoft corporation": "microsoft",
  "anthropic pbc": "anthropic",
  "claude": "anthropic",
  "digitalocean llc": "digitalocean",
  "namecheap inc": "namecheap",
  "cloudflare inc": "cloudflare",
  "atlassian pty ltd": "atlassian",
  "adobe systems": "adobe",
  "adobe inc": "adobe",
}

export function normalizeVendor(vendor: string): string {
  const cleaned = vendor
    .toLowerCase()
    .replace(/[.,]/g, "")
    .replace(/\s+(inc|llc|ltd|pbc|corp|corporation|co|gmbh|pty ltd)\.?$/i, "")
    .replace(/\s+/g, " ")
    .trim()

  return VENDOR_ALIASES[cleaned] ?? cleaned
}

/** Display-friendly canonical name (title-cased, known brands cased right). */
const DISPLAY_OVERRIDES: Record<string, string> = {
  aws: "AWS",
  openai: "OpenAI",
  github: "GitHub",
  digitalocean: "DigitalOcean",
  "google cloud": "Google Cloud",
  "google workspace": "Google Workspace",
}

export function displayVendor(normalized: string): string {
  if (DISPLAY_OVERRIDES[normalized]) return DISPLAY_OVERRIDES[normalized]
  return normalized
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}
