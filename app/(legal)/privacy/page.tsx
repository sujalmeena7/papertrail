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
        updated="August 11, 2026"
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
              invoice data (vendor, amount, date, invoice number). We store the
              extracted fields and the message&rsquo;s subject line; we do not
              store message bodies or attachments.
            </>,
            <>
              <strong>Subscription &amp; billing data</strong> — the
              subscriptions we detect on your behalf, and your plan status.
              Payments are processed by Razorpay; we never see or store your full
              card details.
            </>,
            <>
              <strong>Bank transaction data</strong> — only if you choose to
              link a bank account, we receive the transaction list for that
              account to detect recurring charges. This is optional and
              independent of Gmail.
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
            "We do not scan your whole mailbox. We ask Gmail only for messages matching a receipt-related search (receipt, invoice, payment, billing, subscription, charged), limited to messages newer than your last scan.",
            "We never sell Google user data, and we never use it for advertising.",
            "We do not use Google user data to train generalized AI/ML models.",
            <>
              Message content is sent to one third-party provider (OpenAI) purely
              to extract those fields — see{" "}
              <strong>Automated extraction</strong> below.
            </>,
            "Access can be revoked at any time from your Google Account permissions, or by disconnecting Gmail in Papertrail settings — which deletes our stored tokens and also revokes the grant with Google.",
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

      <LegalSection heading="Automated extraction (AI processing)">
        <p>
          Reading a receipt out of an email is done by a language model, not by a
          human. For each candidate message, Papertrail sends the sender, subject,
          date, attachment file names, and up to the first 6,000 characters of the
          message text to the <strong>OpenAI</strong> API, which returns the
          structured fields we store: vendor, amount, currency, date, invoice
          number, and category.
        </p>
        <LegalList
          items={[
            "OpenAI acts as our processor for this step only. It is the sole third party that receives your email content.",
            "Per OpenAI's API data usage policy, data submitted through their API is not used to train their models, and is retained for up to 30 days for abuse monitoring before deletion.",
            "No human at Papertrail reads your messages as part of this process.",
            "If you never connect Gmail, no email content leaves your inbox and this step never runs.",
          ]}
        />
        <p>
          You can read OpenAI&rsquo;s commitments for API data at{" "}
          <a
            href="https://openai.com/enterprise-privacy/"
            target="_blank"
            rel="noopener noreferrer"
          >
            openai.com/enterprise-privacy
          </a>
          .
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
          providers (subprocessors) required to run Papertrail, and only to the
          extent needed to deliver the service. Each is bound to protect your
          data. In full, they are:
        </p>
        <LegalList
          items={[
            <>
              <strong>Neon</strong> — managed Postgres database where your
              account, extracted receipt fields, and subscriptions are stored.
            </>,
            <>
              <strong>Vercel</strong> — application hosting and serverless
              compute.
            </>,
            <>
              <strong>OpenAI</strong> — receipt field extraction. The only
              subprocessor we send raw message content to; see{" "}
              <strong>Automated extraction</strong> above.
            </>,
            <>
              <strong>Resend</strong> — transactional email (verification codes,
              renewal alerts, the weekly digest).
            </>,
            <>
              <strong>Razorpay</strong> — payment processing. We never see or
              store your full card details.
            </>,
            <>
              <strong>Plaid</strong> — optional bank connection, only if you
              choose to link an account in Settings. Plaid receives your bank
              credentials directly; we never see them. No Google user data is
              shared with Plaid.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection heading="Data retention &amp; deletion">
        <p>
          We keep your data only for as long as your account is active. You can{" "}
          <strong>permanently delete your account and all associated data</strong>{" "}
          at any time from{" "}
          <a href="/dashboard/settings">Settings → Danger zone</a>. Deletion is
          immediate and irreversible: it removes your receipts, subscriptions,
          connected accounts, and profile, and cancels any active subscription.
          If Gmail was connected, deleting your account also revokes our OAuth
          grant with Google, so Papertrail disappears from your Google Account
          permissions.
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
