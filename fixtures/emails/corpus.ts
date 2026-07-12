import type { EmailMessage } from "@/lib/pipeline/types"

// Ground-truth labeled test corpus for the detection pipeline (criterion A/B).
// `expected` is what a correct pipeline should produce.

export interface LabeledEmail {
  email: EmailMessage
  expected: {
    isReceipt: boolean
    vendor?: string
    amountCents?: number
    currency?: string
    date?: string
    invoiceNumber?: string | null
  }
}

export const corpus: LabeledEmail[] = [
  // ============ TRUE RECEIPTS (30) ============
  {
    email: {
      id: "fx-001",
      from: "Amazon Web Services <no-reply-aws@amazon.com>",
      subject: "Amazon Web Services Billing Statement Available [Account: 4521-8890-1123]",
      date: "2026-06-03",
      body: "Greetings from Amazon Web Services,\n\nYour AWS billing statement is available. A charge of $142.87 USD was applied to your Visa ending in 4242 on June 3, 2026.\n\nTotal: $142.87\nBilling period: May 1 - May 31, 2026\nInvoice number: 1592847561\n\nYou can view your full billing details in the AWS Billing Console.",
      attachments: ["Invoice-1592847561.pdf"],
    },
    expected: { isReceipt: true, vendor: "aws", amountCents: 14287, currency: "USD", date: "2026-06-03", invoiceNumber: "1592847561" },
  },
  {
    email: {
      id: "fx-002",
      from: "OpenAI <noreply@tm.openai.com>",
      subject: "Your OpenAI API receipt",
      date: "2026-06-05",
      body: "Thanks for your payment!\n\nAmount paid: $50.00\nDate: June 5, 2026\nPayment method: Mastercard ending 8812\nInvoice #: A1B2C3D4-0012\n\nThis is a receipt for your OpenAI API usage credits purchase.",
    },
    expected: { isReceipt: true, vendor: "openai", amountCents: 5000, currency: "USD", date: "2026-06-05", invoiceNumber: "A1B2C3D4-0012" },
  },
  {
    email: {
      id: "fx-003",
      from: "Vercel <billing@vercel.com>",
      subject: "Your receipt from Vercel #2847-3320",
      date: "2026-06-01",
      body: "Receipt from Vercel\n\nPro plan subscription — Team 'studio-north'\n$20.00 paid on June 1, 2026\nReceipt number: 2847-3320\nCard: Visa •••• 4242",
    },
    expected: { isReceipt: true, vendor: "vercel", amountCents: 2000, currency: "USD", date: "2026-06-01", invoiceNumber: "2847-3320" },
  },
  {
    email: {
      id: "fx-004",
      from: "Stripe <receipts+acct_1abc@stripe.com>",
      subject: "Your Stripe fee invoice for May 2026",
      date: "2026-06-02",
      body: "Your Stripe fees for May 2026 have been charged.\n\nTotal fees: $87.34 USD\nCharged to: bank account ••••6789 on June 2, 2026\nInvoice: in_1PQRSTUVWXYZ\n\nThank you for using Stripe.",
    },
    expected: { isReceipt: true, vendor: "stripe", amountCents: 8734, currency: "USD", date: "2026-06-02", invoiceNumber: "in_1PQRSTUVWXYZ" },
  },
  {
    email: {
      id: "fx-005",
      from: "Google Cloud <payments-noreply@google.com>",
      subject: "Google Cloud: Your invoice for May 2026 is available",
      date: "2026-06-04",
      body: "Your Google Cloud invoice for billing account 01A2B3-C4D5E6-F7G8H9 is now available.\n\nAmount due was automatically charged: $63.12\nInvoice number: 3894756120\nBilling period: May 1, 2026 - May 31, 2026\nPayment received: June 4, 2026",
      attachments: ["3894756120.pdf"],
    },
    expected: { isReceipt: true, vendor: "google cloud", amountCents: 6312, currency: "USD", date: "2026-06-04", invoiceNumber: "3894756120" },
  },
  {
    email: {
      id: "fx-006",
      from: "Figma <no-reply@figma.com>",
      subject: "Receipt for your Figma subscription",
      date: "2026-06-07",
      body: "Hi there,\n\nThis is your receipt for Figma Professional (2 editors, annual).\n\nAmount: $288.00\nPaid: June 7, 2026\nInvoice number: FIG-2026-118234\n\nManage your billing at figma.com/settings.",
    },
    expected: { isReceipt: true, vendor: "figma", amountCents: 28800, currency: "USD", date: "2026-06-07", invoiceNumber: "FIG-2026-118234" },
  },
  {
    email: {
      id: "fx-007",
      from: "Notion <team@makernotes.notion.so>",
      subject: "Your Notion invoice has been paid",
      date: "2026-06-08",
      body: "Payment confirmation\n\nNotion Plus plan — monthly\nWorkspace: Maker Notes\nTotal: $30.00 USD\nPaid on Jun 8, 2026 with Visa ending 4242\nInvoice: NTN-88412-2026",
    },
    expected: { isReceipt: true, vendor: "notion", amountCents: 3000, currency: "USD", date: "2026-06-08", invoiceNumber: "NTN-88412-2026" },
  },
  {
    email: {
      id: "fx-008",
      from: "GitHub <billing@github.com>",
      subject: "[GitHub] Payment receipt for organization 'pixelforge'",
      date: "2026-06-10",
      body: "We received your payment for GitHub Team.\n\nOrganization: pixelforge\nAmount: $16.00 USD\nDate: June 10, 2026\nReceipt #: GH-9982314\n\nQuestions? Visit github.com/settings/billing.",
    },
    expected: { isReceipt: true, vendor: "github", amountCents: 1600, currency: "USD", date: "2026-06-10", invoiceNumber: "GH-9982314" },
  },
  {
    email: {
      id: "fx-009",
      from: "Namecheap <support@namecheap.com>",
      subject: "Namecheap order receipt — Order #88231945",
      date: "2026-06-11",
      body: "Thank you for your purchase!\n\nOrder #88231945\n\nDomain renewal: pixelforge.dev — 1 year — $12.98\nICANN fee: $0.18\nTotal charged: $13.16 USD\nPayment date: June 11, 2026\nPayment method: PayPal",
    },
    expected: { isReceipt: true, vendor: "namecheap", amountCents: 1316, currency: "USD", date: "2026-06-11", invoiceNumber: "88231945" },
  },
  {
    email: {
      id: "fx-010",
      from: "Anthropic <receipts@anthropic.com>",
      subject: "Receipt for Claude API credits",
      date: "2026-06-12",
      body: "Thank you for your purchase.\n\nClaude API credits: $100.00\nDate: June 12, 2026\nReceipt number: anth_rcpt_77812\nBilled to: Visa •••• 4242",
    },
    expected: { isReceipt: true, vendor: "anthropic", amountCents: 10000, currency: "USD", date: "2026-06-12", invoiceNumber: "anth_rcpt_77812" },
  },
  {
    email: {
      id: "fx-011",
      from: "Slack <feedback@slack.com>",
      subject: "Your Slack receipt (workspace: studio-north)",
      date: "2026-06-01",
      body: "Slack Pro — monthly billing\n\nWorkspace: studio-north (8 members)\nAmount charged: $69.60 USD\nBilling date: June 1, 2026\nInvoice: SL-2026-4471120",
    },
    expected: { isReceipt: true, vendor: "slack", amountCents: 6960, currency: "USD", date: "2026-06-01", invoiceNumber: "SL-2026-4471120" },
  },
  {
    email: {
      id: "fx-012",
      from: "DigitalOcean <support@digitalocean.com>",
      subject: "DigitalOcean — Payment Receipt",
      date: "2026-06-01",
      body: "Your payment has been processed.\n\nInvoice for May 2026 usage\nDroplets & volumes: $48.00\nTotal: $48.00 USD\nCharged June 1, 2026 to card ending 4242\nInvoice number: DO-29984417",
      attachments: ["DO-29984417.pdf"],
    },
    expected: { isReceipt: true, vendor: "digitalocean", amountCents: 4800, currency: "USD", date: "2026-06-01", invoiceNumber: "DO-29984417" },
  },
  {
    email: {
      id: "fx-013",
      from: "Adobe <mail@mail.adobe.com>",
      subject: "Your Adobe invoice is ready",
      date: "2026-06-15",
      body: "Thank you for your payment.\n\nCreative Cloud All Apps — monthly\nAmount: $59.99 USD (incl. tax)\nBilled: June 15, 2026\nInvoice number: ADB1129944756\n\nDownload your invoice from your Adobe account.",
    },
    expected: { isReceipt: true, vendor: "adobe", amountCents: 5999, currency: "USD", date: "2026-06-15", invoiceNumber: "ADB1129944756" },
  },
  {
    email: {
      id: "fx-014",
      from: "Cloudflare <noreply@notify.cloudflare.com>",
      subject: "Cloudflare payment confirmation",
      date: "2026-06-16",
      body: "Payment successful.\n\nCloudflare Pro plan — pixelforge.dev\n$25.00 charged on 2026-06-16\nTransaction ID: CF-TXN-5561234\n\nThank you for using Cloudflare.",
    },
    expected: { isReceipt: true, vendor: "cloudflare", amountCents: 2500, currency: "USD", date: "2026-06-16", invoiceNumber: "CF-TXN-5561234" },
  },
  {
    email: {
      id: "fx-015",
      from: "Zoom <no-reply@zoom.us>",
      subject: "Your Zoom receipt — thank you!",
      date: "2026-06-18",
      body: "Receipt\n\nZoom Pro annual plan\nAmount paid: $149.90 USD\nDate: June 18, 2026\nInvoice #: INV88992213\nPayment method: Visa ending in 4242",
    },
    expected: { isReceipt: true, vendor: "zoom", amountCents: 14990, currency: "USD", date: "2026-06-18", invoiceNumber: "INV88992213" },
  },
  {
    email: {
      id: "fx-016",
      from: "Linear <hello@linear.app>",
      subject: "Linear — payment receipt",
      date: "2026-06-20",
      body: "Thanks — your payment went through.\n\nLinear Standard, 5 seats\n$40.00 USD paid on June 20, 2026\nReceipt: LIN-2026-93312",
    },
    expected: { isReceipt: true, vendor: "linear", amountCents: 4000, currency: "USD", date: "2026-06-20", invoiceNumber: "LIN-2026-93312" },
  },
  {
    email: {
      id: "fx-017",
      from: "Twilio <billing-noreply@twilio.com>",
      subject: "Twilio auto-recharge successful",
      date: "2026-06-21",
      body: "Your Twilio account was automatically recharged.\n\nAmount: $20.00 USD\nDate: 2026-06-21\nAccount: AC7781...\nTransaction: TW-RCH-119284\n\nYour new balance is $21.45.",
    },
    expected: { isReceipt: true, vendor: "twilio", amountCents: 2000, currency: "USD", date: "2026-06-21", invoiceNumber: "TW-RCH-119284" },
  },
  {
    email: {
      id: "fx-018",
      from: "1Password <support@1password.com>",
      subject: "Receipt: 1Password Teams annual renewal",
      date: "2026-06-22",
      body: "Your 1Password Teams subscription has renewed.\n\n10 team members × $47.88/yr\nTotal: $478.80 USD\nRenewed on June 22, 2026\nInvoice number: OP-2026-45102",
    },
    expected: { isReceipt: true, vendor: "1password", amountCents: 47880, currency: "USD", date: "2026-06-22", invoiceNumber: "OP-2026-45102" },
  },
  {
    email: {
      id: "fx-019",
      from: "Sentry <no-reply@md.getsentry.com>",
      subject: "Sentry invoice paid — Team plan",
      date: "2026-06-23",
      body: "Invoice paid.\n\nSentry Team plan, June 2026\nAmount: $26.00 USD\nPaid: June 23, 2026\nInvoice ID: SEN-77234",
    },
    expected: { isReceipt: true, vendor: "sentry", amountCents: 2600, currency: "USD", date: "2026-06-23", invoiceNumber: "SEN-77234" },
  },
  {
    email: {
      id: "fx-020",
      from: "Supabase <billing@supabase.com>",
      subject: "Your Supabase Pro subscription receipt",
      date: "2026-06-25",
      body: "Payment received — thank you!\n\nSupabase Pro — org 'pixelforge'\n$25.00 USD, charged June 25, 2026\nReceipt: SUPA-90233",
    },
    expected: { isReceipt: true, vendor: "supabase", amountCents: 2500, currency: "USD", date: "2026-06-25", invoiceNumber: "SUPA-90233" },
  },
  {
    email: {
      id: "fx-021",
      from: "Canva <no-reply@canva.com>",
      subject: "Payment confirmation — Canva Pro",
      date: "2026-06-26",
      body: "Hi! Your Canva Pro payment was successful.\n\nPlan: Canva Pro (monthly)\nAmount: $12.99 USD\nDate: 26 June 2026\nReceipt number: CANVA-118845",
    },
    expected: { isReceipt: true, vendor: "canva", amountCents: 1299, currency: "USD", date: "2026-06-26", invoiceNumber: "CANVA-118845" },
  },
  {
    email: {
      id: "fx-022",
      from: "Mailchimp <billing@mailchimp.com>",
      subject: "Mailchimp receipt for June 2026",
      date: "2026-06-27",
      body: "Thanks for your payment.\n\nStandard plan — 5,000 contacts\nTotal: $75.00 USD\nBilled June 27, 2026\nReceipt ID: MC-2026-70142",
    },
    expected: { isReceipt: true, vendor: "mailchimp", amountCents: 7500, currency: "USD", date: "2026-06-27", invoiceNumber: "MC-2026-70142" },
  },
  {
    email: {
      id: "fx-023",
      from: "Atlassian <noreply@am.atlassian.com>",
      subject: "Your Atlassian invoice AT-99123 has been paid",
      date: "2026-06-28",
      body: "Invoice AT-99123 — PAID\n\nJira Software Standard, 10 users, monthly\nTotal: $77.50 USD\nPayment date: June 28, 2026\nPayment method: Visa •••• 4242",
      attachments: ["invoice-AT-99123.pdf"],
    },
    expected: { isReceipt: true, vendor: "atlassian", amountCents: 7750, currency: "USD", date: "2026-06-28", invoiceNumber: "AT-99123" },
  },
  {
    email: {
      id: "fx-024",
      from: "Railway <team@railway.app>",
      subject: "Railway usage invoice — paid",
      date: "2026-07-01",
      body: "Your Railway usage for June 2026 has been billed.\n\nCompute + storage: $18.42\nTotal charged: $18.42 USD on July 1, 2026\nInvoice: RW-2026-06-8812",
    },
    expected: { isReceipt: true, vendor: "railway", amountCents: 1842, currency: "USD", date: "2026-07-01", invoiceNumber: "RW-2026-06-8812" },
  },
  {
    email: {
      id: "fx-025",
      from: "Grammarly <info@em.grammarly.com>",
      subject: "Your Grammarly Business receipt",
      date: "2026-07-02",
      body: "Receipt for your records\n\nGrammarly Business — 3 seats, annual\nAmount: $540.00 USD\nCharged: July 2, 2026\nOrder: GRAM-2026-33481",
    },
    expected: { isReceipt: true, vendor: "grammarly", amountCents: 54000, currency: "USD", date: "2026-07-02", invoiceNumber: "GRAM-2026-33481" },
  },
  {
    email: {
      id: "fx-026",
      from: "Amazon Web Services <no-reply-aws@amazon.com>",
      subject: "AWS billing: payment of €89.20 processed",
      date: "2026-07-03",
      body: "Your AWS Europe invoice has been paid.\n\nTotal: €89.20 EUR\nInvoice number: EUINV26-1102934\nPayment date: 3 July 2026\nBilling period: June 2026",
      attachments: ["EUINV26-1102934.pdf"],
    },
    expected: { isReceipt: true, vendor: "aws", amountCents: 8920, currency: "EUR", date: "2026-07-03", invoiceNumber: "EUINV26-1102934" },
  },
  {
    email: {
      id: "fx-027",
      from: "Framer <billing@framer.com>",
      subject: "Framer — payment received",
      date: "2026-07-04",
      body: "We've received your payment.\n\nFramer Pro site plan — studio-north.com\n£15.00 GBP charged on 4 July 2026\nInvoice: FRM-77120",
    },
    expected: { isReceipt: true, vendor: "framer", amountCents: 1500, currency: "GBP", date: "2026-07-04", invoiceNumber: "FRM-77120" },
  },
  {
    email: {
      id: "fx-028",
      from: "Google Workspace <workspace-noreply@google.com>",
      subject: "Google Workspace: Payment received for pixelforge.dev",
      date: "2026-07-05",
      body: "Thank you. Your payment has been received.\n\nGoogle Workspace Business Standard — 4 users\nAmount: $48.00 USD\nDate: July 5, 2026\nOrder number: GW-118472011",
    },
    expected: { isReceipt: true, vendor: "google workspace", amountCents: 4800, currency: "USD", date: "2026-07-05", invoiceNumber: "GW-118472011" },
  },
  {
    email: {
      id: "fx-029",
      from: "Netlify <team@netlify.com>",
      subject: "Netlify receipt — Pro plan",
      date: "2026-07-06",
      body: "Your receipt from Netlify\n\nPro plan membership — July 2026\n$19.00 USD paid July 6, 2026\nReceipt: NET-2026-90871",
    },
    expected: { isReceipt: true, vendor: "netlify", amountCents: 1900, currency: "USD", date: "2026-07-06", invoiceNumber: "NET-2026-90871" },
  },
  {
    email: {
      id: "fx-030",
      from: "Webflow <no-reply@webflow.com>",
      subject: "Receipt: Webflow CMS site plan renewal",
      date: "2026-07-07",
      body: "Your Webflow subscription renewed successfully.\n\nCMS site plan — clientsite.com (annual)\nTotal: $276.00 USD\nRenewal date: July 7, 2026\nInvoice number: WF-2026-45520",
    },
    expected: { isReceipt: true, vendor: "webflow", amountCents: 27600, currency: "USD", date: "2026-07-07", invoiceNumber: "WF-2026-45520" },
  },

  // ============ NON-RECEIPTS (25) ============
  {
    email: {
      id: "fx-031",
      from: "Vercel <marketing@vercel.com>",
      subject: "Introducing v0 by Vercel — build UI with AI",
      date: "2026-06-02",
      body: "Hey there!\n\nWe're excited to introduce our newest product. Build user interfaces with AI, starting at $20/month.\n\nTry it today and get 20% off your first billing cycle!",
    },
    expected: { isReceipt: false },
  },
  {
    email: {
      id: "fx-032",
      from: "Stripe <notifications@stripe.com>",
      subject: "Payment failed for your Stripe subscription",
      date: "2026-06-03",
      body: "We attempted to charge your card ending 4242 for $87.34 but the payment was declined.\n\nPlease update your payment method to avoid service interruption. We'll retry in 3 days.",
    },
    expected: { isReceipt: false },
  },
  {
    email: {
      id: "fx-033",
      from: "Notion <team@makernotes.notion.so>",
      subject: "Your Notion trial ends in 3 days",
      date: "2026-06-04",
      body: "Your free trial of Notion Plus ends June 7. Add a payment method to keep your workspace features. Plans start at $10 per member per month.",
    },
    expected: { isReceipt: false },
  },
  {
    email: {
      id: "fx-034",
      from: "DoorDash <no-reply@doordash.com>",
      subject: "Your DoorDash receipt — Thai Garden",
      date: "2026-06-05",
      body: "Thanks for your order!\n\nThai Garden\nPad Thai, Spring Rolls\nSubtotal: $24.50\nDelivery + fees: $6.99\nTotal: $31.49 charged to Visa 4242 on June 5, 2026",
    },
    expected: { isReceipt: false }, // personal food delivery, not a business expense
  },
  {
    email: {
      id: "fx-035",
      from: "Netflix <info@mailer.netflix.com>",
      subject: "Your Netflix payment",
      date: "2026-06-06",
      body: "Your payment of $15.49 for the Standard plan was processed on June 6, 2026. Your next billing date is July 6, 2026.",
    },
    expected: { isReceipt: false }, // personal entertainment subscription
  },
  {
    email: {
      id: "fx-036",
      from: "AWS Marketing <aws-marketing-email-replies@amazon.com>",
      subject: "Save up to 72% with Reserved Instances — limited time",
      date: "2026-06-07",
      body: "Optimize your AWS costs. Reserved Instances can save you up to 72% versus on-demand pricing. For example, save $1,420.00 per year on m5.xlarge. Learn more in the AWS console.",
    },
    expected: { isReceipt: false },
  },
  {
    email: {
      id: "fx-037",
      from: "GitHub <noreply@github.com>",
      subject: "[pixelforge/webapp] Build failed: main (a3f8c21)",
      date: "2026-06-08",
      body: "Run failed for main (a3f8c21)\n\nci/build — Failed in 2m 14s\n\nView the workflow run for details.",
    },
    expected: { isReceipt: false },
  },
  {
    email: {
      id: "fx-038",
      from: "Uber Receipts <noreply@uber.com>",
      subject: "Your Friday evening trip with Uber",
      date: "2026-06-12",
      body: "Thanks for riding!\n\nTrip fare: $18.24\nTotal charged: $18.24 to Apple Pay\nFrom: Downtown → Home\nJune 12, 2026, 7:42 PM",
    },
    expected: { isReceipt: false }, // personal rideshare (ambiguous, defaulting personal)
  },
  {
    email: {
      id: "fx-039",
      from: "Figma <no-reply@figma.com>",
      subject: "New: Figma Slides is here",
      date: "2026-06-13",
      body: "Introducing Figma Slides — beautiful presentations, built in Figma. Available now on all paid plans starting at $12/editor/month. Watch the demo.",
    },
    expected: { isReceipt: false },
  },
  {
    email: {
      id: "fx-040",
      from: "Namecheap <renewals@namecheap.com>",
      subject: "REMINDER: pixelforge.dev expires in 30 days",
      date: "2026-06-14",
      body: "Your domain pixelforge.dev will expire on July 14, 2026. Renew now for $12.98/yr to avoid losing it. Auto-renew is currently OFF.",
    },
    expected: { isReceipt: false }, // renewal reminder, no charge yet
  },
  {
    email: {
      id: "fx-041",
      from: "Zoom <no-reply@zoom.us>",
      subject: "Reminder: Your meeting 'Client sync' starts in 15 minutes",
      date: "2026-06-15",
      body: "Your scheduled meeting starts soon.\n\nClient sync\nJune 15, 2026, 2:00 PM\nJoin: https://zoom.us/j/99887766",
    },
    expected: { isReceipt: false },
  },
  {
    email: {
      id: "fx-042",
      from: "Spotify <no-reply@spotify.com>",
      subject: "Your Spotify Premium receipt",
      date: "2026-06-16",
      body: "Receipt\n\nSpotify Premium Individual\n$11.99 charged on June 16, 2026\nNext billing: July 16, 2026",
    },
    expected: { isReceipt: false }, // personal entertainment
  },
  {
    email: {
      id: "fx-043",
      from: "Amazon.com <ship-confirm@amazon.com>",
      subject: "Your package has shipped!",
      date: "2026-06-17",
      body: "Your package with USB-C cables is on the way. Track your shipment. Arriving: June 19.",
    },
    expected: { isReceipt: false },
  },
  {
    email: {
      id: "fx-044",
      from: "Adobe <mail@mail.adobe.com>",
      subject: "Your Creative Cloud payment could not be processed",
      date: "2026-06-18",
      body: "We couldn't process your payment of $59.99 for Creative Cloud All Apps. Please update your payment details within 7 days to avoid interruption.",
    },
    expected: { isReceipt: false },
  },
  {
    email: {
      id: "fx-045",
      from: "HubSpot <marketing@hubspot.com>",
      subject: "Free CRM guide: 10 ways to close more deals",
      date: "2026-06-19",
      body: "Download our free guide and learn how top agencies close 40% more deals. Plus: HubSpot Starter is now $15/month per seat!",
    },
    expected: { isReceipt: false },
  },
  {
    email: {
      id: "fx-046",
      from: "Google Cloud <cloudplatform-noreply@google.com>",
      subject: "Your Google Cloud free trial has started",
      date: "2026-06-20",
      body: "Welcome! You have $300 in free credits to explore Google Cloud over the next 90 days. No charges will be made until you upgrade to a paid account.",
    },
    expected: { isReceipt: false },
  },
  {
    email: {
      id: "fx-047",
      from: "Stripe <receipts@stripe.com>",
      subject: "Refund processed: $25.00 to your card",
      date: "2026-06-21",
      body: "A refund of $25.00 USD has been processed to your Visa ending 4242. It may take 5-10 business days to appear on your statement. Original charge: Supabase Pro, June 2026.",
    },
    expected: { isReceipt: false }, // refunds out of scope for Cycle 1
  },
  {
    email: {
      id: "fx-048",
      from: "LinkedIn <messages-noreply@linkedin.com>",
      subject: "You have 3 new messages",
      date: "2026-06-22",
      body: "Sarah Chen sent you a message about a potential project. Log in to read and reply.",
    },
    expected: { isReceipt: false },
  },
  {
    email: {
      id: "fx-049",
      from: "Webflow <no-reply@webflow.com>",
      subject: "Quote for Enterprise plan — as requested",
      date: "2026-06-23",
      body: "Hi! As discussed, here's your custom Enterprise quote:\n\nEnterprise site plan: $1,200.00/year\nThis quote is valid for 30 days. No payment has been taken. Reply to accept.",
    },
    expected: { isReceipt: false }, // quote, not a payment
  },
  {
    email: {
      id: "fx-050",
      from: "Chase <no.reply.alerts@chase.com>",
      subject: "Your statement is ready",
      date: "2026-06-24",
      body: "Your Chase credit card statement for the period ending June 20, 2026 is now available. Statement balance: $2,847.12. Minimum payment due: $35.00 by July 15.",
    },
    expected: { isReceipt: false }, // bank statement, not a vendor receipt
  },
  {
    email: {
      id: "fx-051",
      from: "Calendly <notifications@calendly.com>",
      subject: "New event scheduled: Intro call with Alex Rivera",
      date: "2026-06-25",
      body: "A new event has been scheduled.\n\nIntro call — 30 minutes\nJune 27, 2026, 10:00 AM PST\nInvitee: Alex Rivera (alex@example.com)",
    },
    expected: { isReceipt: false },
  },
  {
    email: {
      id: "fx-052",
      from: "Substack <no-reply@substack.com>",
      subject: "Your subscription to 'Design Weekly' is confirmed",
      date: "2026-06-26",
      body: "You're now subscribed to Design Weekly (free plan). You'll receive new posts in your inbox. Upgrade to paid for $8/month to unlock the archive.",
    },
    expected: { isReceipt: false }, // free subscription, no charge
  },
  {
    email: {
      id: "fx-053",
      from: "Vercel <notifications@vercel.com>",
      subject: "Deployment failed: studio-north/webapp",
      date: "2026-06-27",
      body: "Your deployment failed.\n\nProject: webapp\nBranch: main\nError: Build exceeded memory limit\n\nView the build logs for details.",
    },
    expected: { isReceipt: false },
  },
  {
    email: {
      id: "fx-054",
      from: "OpenAI <noreply@tm.openai.com>",
      subject: "Your OpenAI usage is approaching your monthly budget",
      date: "2026-06-28",
      body: "Your API usage has reached $45.00 of your $50.00 monthly budget. If you reach your budget cap, API requests will be rejected. You can adjust limits in your account settings.",
    },
    expected: { isReceipt: false }, // usage warning, not a charge
  },
  {
    email: {
      id: "fx-055",
      from: "Airbnb <automated@airbnb.com>",
      subject: "Receipt: your reservation in Lisbon",
      date: "2026-06-29",
      body: "Reservation confirmed!\n\n3 nights in Lisbon, Aug 12-15\nTotal: $412.00 charged to Visa 4242\nConfirmation: HMABCD1234",
    },
    expected: { isReceipt: false }, // personal travel (no business context in email)
  },
]

export const fixtureEmails: EmailMessage[] = corpus.map((c) => c.email)
