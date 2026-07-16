import type { Metadata } from "next"
import { LegalHeader, LegalSection, LegalList } from "../_components/legal-prose"

export const metadata: Metadata = {
  title: "Privacy Policy — Papertrail",
  description:
    "How Papertrail collects, uses, protects, and lets you delete your data, including our use of Google user data.",
}

const CONTACT = "meenasujal60@gmail.com"

export default function PrivacyPage() {
  return (
    <article className="flex flex-col">
      <LegalHeader
        title="Privacy Policy"
        updated="July 16, 2026"
        intro="This policy explains what data Papertrail collects, why we collect it, how it is protected, and the controls you have over it — including how our access to your Google account data is used and safeguarded."
      />

      <LegalSection heading="Who we are">
        <p>
          Papertrail (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is an invoice and
          subscription tracking service that helps freelancers and small teams
          find business receipts in their inbox, track recurring subscriptions,
          and prepare tax-ready reports. You can reach us any time at{" "}
          <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </LegalSection>

      <LegalSection heading="Information we collect">
        <LegalList
          items={[
            <>
              <strong>Account information</strong> — your name, email address,
              and a securely hashed password when you sign up.
            </>,
            <>
              <strong>Email content you connect</strong> — when you link a Gmail
              account, we read messages solely to detect and extract receipt and
              invoice data (vendor, amount, date, invoice number).
            </>,
            <>
              <strong>Subscription &amp; billing data</strong> — the
              subscriptions we detect on your behalf, and your plan status.
              Payments are processed by Razorpay; we never see or store your full
              card details.
            </>,
            <>
              <strong>Usage &amp; device data</strong> — basic logs and device
              tokens needed to operate capture devices and keep your account
              secure.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection heading="How we use Google user data">
        <p>
          When you connect Gmail, Papertrail requests read-only access
          (<strong>gmail.readonly</strong>) for a single purpose: to scan your
          messages for receipts and invoices and organize them for you.
          Specifically:
        </p>
        <LegalList
          items={[
            "We read message contents only to identify and extract receipt/invoice fields. We do not read messages for any other purpose.",
            "We never sell Google user data, and we never use it for advertising.",
            "We do not use Google user data to train generalized AI/ML models.",
            "Access can be revoked at any time from your Google Account permissions or by disconnecting Gmail in Papertrail settings.",
          ]}
        />
        <p>
          Papertrail&rsquo;s use and transfer of information received from Google
          APIs adheres to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
      </LegalSection>

      <LegalSection heading="How we protect your data">
        <LegalList
          items={[
            "Sensitive tokens and credentials are encrypted at rest.",
            "All data is transmitted over encrypted (HTTPS/TLS) connections.",
            "Passwords are stored only as salted hashes, never in plain text.",
            "Access to production data is limited to what is required to operate the service.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Data sharing">
        <p>
          We do not sell your personal data. We share it only with the service
          providers required to run Papertrail — such as our database and
          hosting provider, our email provider (Resend), and our payment
          processor (Razorpay) — and only to the extent needed to deliver the
          service. Each is bound to protect your data.
        </p>
      </LegalSection>

      <LegalSection heading="Data retention &amp; deletion">
        <p>
          We keep your data only for as long as your account is active. You can{" "}
          <strong>permanently delete your account and all associated data</strong>{" "}
          at any time from{" "}
          <a href="/dashboard/settings">Settings → Danger zone</a>. Deletion is
          immediate and irreversible: it removes your receipts, subscriptions,
          connected accounts, and profile, and cancels any active subscription.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          You may access, correct, export, or delete your data at any time.
          Most of this is available directly in-app; for anything else, email{" "}
          <a href={`mailto:${CONTACT}`}>{CONTACT}</a> and we will respond
          promptly.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to this policy">
        <p>
          We may update this policy as the product evolves. Material changes will
          be reflected by the &ldquo;Last updated&rdquo; date above, and where
          appropriate we will notify you by email.
        </p>
      </LegalSection>
    </article>
  )
}
