import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"

export function EmailLayout({
  preview,
  heading,
  children,
  unsubscribeLink,
}: {
  preview: string
  heading: string
  children: React.ReactNode
  unsubscribeLink?: string
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>{heading}</Heading>
          <Section style={section}>{children}</Section>
          <Hr style={hr} />
          <Text style={footer}>
            PaperTrail — your subscription companion
          </Text>
          {unsubscribeLink && (
            <Text style={footer}>
              <Link href={unsubscribeLink} style={link}>
                Unsubscribe from renewal alerts
              </Link>
            </Text>
          )}
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  backgroundColor: "#f6f9fc",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "24px",
  maxWidth: "560px",
  borderRadius: "8px",
}

const h1 = {
  color: "#1a1a2e",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.3",
  margin: "0 0 24px",
}

const section = {
  margin: "0 0 24px",
}

const hr = {
  borderColor: "#e6ebf1",
  margin: "24px 0",
}

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0 0 8px",
}

const link = {
  color: "#5469d4",
  textDecoration: "underline",
}
