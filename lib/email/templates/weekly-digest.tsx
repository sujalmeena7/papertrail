import { Link, Section, Text } from "@react-email/components"
import { EmailLayout } from "./shared"

function formatAmount(cents: number, currency: string = "USD"): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  })
}

export function WeeklyDigestEmail({
  candidates,
  totalMonthlyCents,
  currency = "USD",
  dashboardUrl,
  unsubscribeUrl,
}: {
  candidates: { vendorName: string; reason: string; amountCents: number }[]
  totalMonthlyCents: number
  currency?: string
  dashboardUrl: string
  unsubscribeUrl: string
}) {
  const totalFormatted = formatAmount(totalMonthlyCents, currency)
  const preview = `You could save ${totalFormatted}/mo across ${candidates.length} subscription${candidates.length === 1 ? "" : "s"}`

  return (
    <EmailLayout
      preview={preview}
      heading={`You could save ${totalFormatted}/mo`}
      unsubscribeLink={unsubscribeUrl}
      unsubscribeLabel="Unsubscribe from weekly digest"
    >
      <Text style={paragraph}>
        Here's what PaperTrail found in your subscriptions this week:
      </Text>
      {candidates.map((c, i) => (
        <Section key={i} style={row}>
          <Text style={vendorText}>
            <strong>{c.vendorName}</strong> — {c.reason}
          </Text>
          <Text style={amountText}>{formatAmount(c.amountCents, currency)}/mo</Text>
        </Section>
      ))}
      <Link href={dashboardUrl} style={button}>
        Review in Dashboard
      </Link>
    </EmailLayout>
  )
}

const paragraph = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
}

const row = {
  margin: "0 0 12px",
}

const vendorText = {
  color: "#1a1a2e",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
}

const amountText = {
  color: "#525f7f",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0",
}

const button = {
  backgroundColor: "#5469d4",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "500",
  padding: "12px 24px",
  textDecoration: "none",
  marginTop: "8px",
}
