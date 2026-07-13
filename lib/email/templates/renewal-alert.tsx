import { Link, Text } from "@react-email/components"
import { EmailLayout } from "./shared"

export function RenewalAlertEmail({
  vendorName,
  amount,
  renewalDate,
  currency = "USD",
  dashboardUrl,
  unsubscribeUrl,
}: {
  vendorName: string
  amount: string
  renewalDate: string
  currency?: string
  dashboardUrl: string
  unsubscribeUrl: string
}) {
  const preview = `${vendorName} renews on ${renewalDate} for ${amount} ${currency}`

  return (
    <EmailLayout
      preview={preview}
      heading={`${vendorName} is renewing soon`}
      unsubscribeLink={unsubscribeUrl}
    >
      <Text style={paragraph}>
        Your <strong>{vendorName}</strong> subscription is scheduled to renew
        on <strong>{renewalDate}</strong> for{" "}
        <strong>
          {amount} {currency}
        </strong>
        .
      </Text>
      <Link href={dashboardUrl} style={button}>
        View in Dashboard
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

const button = {
  backgroundColor: "#5469d4",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "500",
  padding: "12px 24px",
  textDecoration: "none",
}
