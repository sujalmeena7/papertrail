import { fixtureEmails } from "@/fixtures/emails/corpus"
import type { EmailMessage, EmailSource } from "@/lib/pipeline/types"

/**
 * Fixture email source: serves the labeled test corpus as if it were a
 * mailbox. Used for demo scans and the eval runner until real Gmail OAuth
 * credentials are provided.
 */
export const fixtureSource: EmailSource = {
  name: "fixture",
  async fetchEmails(options): Promise<EmailMessage[]> {
    let emails = fixtureEmails
    if (options?.after) {
      const after = options.after.toISOString().slice(0, 10)
      emails = emails.filter((e) => e.date >= after)
    }
    if (options?.max) {
      emails = emails.slice(0, options.max)
    }
    return emails
  },
}
