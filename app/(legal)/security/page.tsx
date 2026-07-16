import type { Metadata } from "next"
import { LegalHeader, LegalSection, LegalList } from "../_components/legal-prose"

export const metadata: Metadata = {
  title: "Security — Papertrail",
  description:
    "How Papertrail keeps your data safe: encryption, access controls, payments, and vulnerability reporting.",
}

const CONTACT = "meenasujal60@gmail.com"

export default function SecurityPage() {
  return (
    <article className="flex flex-col">
      <LegalHeader
        title="Security"
        updated="July 16, 2026"
        intro="Papertrail connects to your email and financial data, so security is foundational to how we build. Here is how we protect it."
      />

      <LegalSection heading="Encryption">
        <LegalList
          items={[
            "All traffic between you and Papertrail is encrypted in transit with TLS (HTTPS).",
            "Sensitive credentials — including OAuth tokens and device tokens — are encrypted at rest.",
            "Account passwords are stored only as salted one-way hashes and are never recoverable in plain text.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Access to your inbox">
        <p>
          Gmail is connected using read-only access
          (<strong>gmail.readonly</strong>). We read messages only to detect
          receipts and invoices — never to send email, modify your mailbox, or
          for any unrelated purpose. You can revoke access at any time from your
          Google Account or by disconnecting Gmail in settings.
        </p>
      </LegalSection>

      <LegalSection heading="Payments">
        <p>
          Card payments are handled entirely by our PCI-compliant payment
          processor, Razorpay. Papertrail never sees or stores your full card
          number, CVV, or banking credentials. Webhooks from Razorpay are
          verified with a signed secret before they are trusted.
        </p>
      </LegalSection>

      <LegalSection heading="Access controls">
        <LegalList
          items={[
            "Every request is authenticated, and data is scoped to the signed-in user — you can only ever see your own records.",
            "Sensitive server actions re-verify your identity and permissions on the server, not just in the browser.",
            "Access to production systems is limited to what is strictly required to operate the service.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Your control">
        <p>
          You can permanently and irreversibly delete your account and all
          associated data at any time from{" "}
          <a href="/dashboard/settings">Settings → Danger zone</a>. Deletion
          removes your receipts, subscriptions, connected accounts, and profile,
          and cancels any active subscription.
        </p>
      </LegalSection>

      <LegalSection heading="Reporting a vulnerability">
        <p>
          If you believe you have found a security issue, we would genuinely like
          to hear from you. Please email{" "}
          <a href={`mailto:${CONTACT}`}>{CONTACT}</a> with details and steps to
          reproduce, and give us a reasonable chance to respond before any public
          disclosure. We appreciate responsible reporting.
        </p>
      </LegalSection>
    </article>
  )
}
