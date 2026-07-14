import { Text } from "@react-email/components"
import { EmailLayout } from "./shared"

export function VerificationCodeEmail({ code }: { code: string }) {
  return (
    <EmailLayout
      preview={`Your PaperTrail verification code is ${code}`}
      heading="Verify your email"
    >
      <Text style={paragraph}>
        Enter this code to finish creating your PaperTrail account:
      </Text>
      <Text style={codeStyle}>{code}</Text>
      <Text style={paragraph}>This code expires in 5 minutes.</Text>
    </EmailLayout>
  )
}

const paragraph = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
}

const codeStyle = {
  backgroundColor: "#f6f9fc",
  borderRadius: "6px",
  color: "#1a1a2e",
  fontSize: "32px",
  fontWeight: "700",
  letterSpacing: "8px",
  padding: "16px 24px",
  textAlign: "center" as const,
  margin: "0 0 24px",
}
