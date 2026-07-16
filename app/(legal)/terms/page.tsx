import type { Metadata } from "next"
import { LegalHeader, LegalSection, LegalList } from "../_components/legal-prose"

export const metadata: Metadata = {
  title: "Terms of Service — Papertrail",
  description:
    "The terms that govern your use of Papertrail, including subscriptions, billing, and acceptable use.",
}

const CONTACT = "meenasujal60@gmail.com"

export default function TermsPage() {
  return (
    <article className="flex flex-col">
      <LegalHeader
        title="Terms of Service"
        updated="July 16, 2026"
        intro="These terms govern your access to and use of Papertrail. By creating an account or using the service, you agree to them."
      />

      <LegalSection heading="Your account">
        <p>
          You must provide accurate information when signing up and are
          responsible for keeping your login credentials secure. You are
          responsible for all activity that happens under your account. You must
          be old enough to form a binding contract in your jurisdiction to use
          Papertrail.
        </p>
      </LegalSection>

      <LegalSection heading="The service">
        <p>
          Papertrail helps you find receipts and invoices in connected accounts,
          track subscriptions, and export tax-ready reports. We work hard to keep
          detection accurate, but automated extraction can miss items or make
          mistakes — you are responsible for reviewing your records before
          relying on them for accounting or tax purposes.
        </p>
      </LegalSection>

      <LegalSection heading="Plans, billing &amp; cancellation">
        <LegalList
          items={[
            "Papertrail offers a Free plan and a paid Pro plan. Paid plans are billed in advance on a recurring basis through our payment processor, Razorpay.",
            "You can cancel Pro at any time from your billing settings. Access continues until the end of the current paid period; we do not provide prorated refunds for partial periods unless required by law.",
            "Deleting your account cancels any active subscription immediately.",
            "Prices may change; we will give reasonable notice before any change affects your renewals.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>You agree not to:</p>
        <LegalList
          items={[
            "Access accounts or data you are not authorized to access.",
            "Attempt to disrupt, reverse-engineer, or abuse the service or its infrastructure.",
            "Use Papertrail for any unlawful purpose or in violation of any third party's rights.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Your data">
        <p>
          You retain ownership of your data. Our handling of it is described in
          our <a href="/privacy">Privacy Policy</a>. You can permanently delete
          your account and data at any time from{" "}
          <a href="/dashboard/settings">Settings → Danger zone</a>.
        </p>
      </LegalSection>

      <LegalSection heading="Disclaimers &amp; liability">
        <p>
          Papertrail is provided &ldquo;as is&rdquo; without warranties of any
          kind. It is a bookkeeping aid, not tax, legal, or accounting advice. To
          the maximum extent permitted by law, we are not liable for any
          indirect or consequential damages, or for any loss arising from your
          reliance on automatically extracted data.
        </p>
      </LegalSection>

      <LegalSection heading="Termination">
        <p>
          You may stop using Papertrail and delete your account at any time. We
          may suspend or terminate accounts that violate these terms. Provisions
          that by their nature should survive termination will do so.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about these terms? Email us at{" "}
          <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </LegalSection>
    </article>
  )
}
