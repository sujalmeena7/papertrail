import { randomUUID } from "crypto"
import { db } from "@/lib/db"
import { receipts, scans } from "@/lib/db/schema"
import { and, eq, inArray } from "drizzle-orm"
import { classifyEmail, isFatalAiError } from "./classify"
import { normalizeVendor } from "./normalize"
import { prefilterEmail } from "./prefilter"
import type { EmailSource, ScanStats } from "./types"

const CONFIDENCE_THRESHOLD = 0.6
const LLM_CONCURRENCY = 5

/**
 * Runs a full scan: fetch emails from the source, pre-filter, classify with
 * the LLM, and persist receipts idempotently (re-scans never duplicate).
 */
export async function runScan(
  userId: string,
  source: EmailSource,
  options?: { after?: Date; max?: number },
): Promise<{ scanId: string; stats: ScanStats }> {
  const scanId = randomUUID()
  await db.insert(scans).values({
    id: scanId,
    userId,
    status: "running",
    source: source.name,
  })

  try {
    const emails = await source.fetchEmails(options)

    // Skip emails already ingested for this user+source (idempotent re-scan).
    const existing = emails.length
      ? await db
          .select({ sourceRef: receipts.sourceRef })
          .from(receipts)
          .where(
            and(
              eq(receipts.userId, userId),
              eq(receipts.source, source.name),
              inArray(
                receipts.sourceRef,
                emails.map((e) => e.id),
              ),
            ),
          )
      : []
    const seen = new Set(existing.map((r) => r.sourceRef))

    const candidates = emails.filter(
      (e) => !seen.has(e.id) && prefilterEmail(e).pass,
    )

    const stats: ScanStats = {
      emailsScanned: emails.length,
      emailsMatched: 0,
      receiptsCreated: 0,
      receiptsSkipped: emails.filter((e) => seen.has(e.id)).length,
    }

    // Classify candidates with bounded concurrency, collecting matches to
    // insert in a single batch afterwards (one DB round trip instead of one
    // per receipt — matters a lot given the remote DB's ~1s round-trip latency).
    const toInsert: (typeof receipts.$inferInsert)[] = []
    let classificationFailures = 0
    let firstFailure: string | null = null
    for (let i = 0; i < candidates.length; i += LLM_CONCURRENCY) {
      const batch = candidates.slice(i, i + LLM_CONCURRENCY)
      const results = await Promise.allSettled(
        batch.map(async (email) => {
          const result = await classifyEmail(email)
          return { email, result }
        }),
      )

      for (const settled of results) {
        if (settled.status === "rejected") {
          classificationFailures++
          if (!firstFailure) {
            firstFailure =
              settled.reason instanceof Error
                ? settled.reason.message
                : String(settled.reason)
          }
          // A bad key / exhausted quota will reject every email — bail out
          // now with an actionable message instead of grinding the whole batch.
          if (isFatalAiError(settled.reason)) {
            throw new Error(
              `AI classification rejected — check your API key or quota. Provider error: ${firstFailure}`,
            )
          }
          continue
        }
        const { email, result } = settled.value
        if (!result.isReceipt || result.confidence < CONFIDENCE_THRESHOLD) {
          continue
        }
        stats.emailsMatched++

        toInsert.push({
          id: randomUUID(),
          userId,
          vendor: result.vendor,
          vendorNormalized: normalizeVendor(result.vendor),
          amountCents: result.amountCents,
          currency: result.currency,
          receiptDate: result.date,
          invoiceNumber: result.invoiceNumber,
          category: result.category,
          source: source.name,
          sourceRef: email.id,
          confidence: result.confidence,
          rawSubject: email.subject,
        })
      }
    }

    // Single batch insert for every matched receipt. returning() gives the
    // true count in case onConflictDoNothing skips any duplicate.
    if (toInsert.length) {
      const inserted = await db
        .insert(receipts)
        .values(toInsert)
        .onConflictDoNothing()
        .returning({ id: receipts.id })
      stats.receiptsCreated = inserted.length
    }

    // If every classification attempt failed, the scan itself failed —
    // surface the underlying error instead of reporting "0 receipts".
    if (candidates.length > 0 && classificationFailures === candidates.length) {
      throw new Error(
        `Classification failed for all ${candidates.length} candidate emails. First error: ${firstFailure}`,
      )
    }

    await db
      .update(scans)
      .set({
        status: "completed",
        emailsScanned: stats.emailsScanned,
        emailsMatched: stats.emailsMatched,
        receiptsCreated: stats.receiptsCreated,
        receiptsSkipped: stats.receiptsSkipped,
        completedAt: new Date(),
      })
      .where(eq(scans.id, scanId))

    return { scanId, stats }
  } catch (error) {
    await db
      .update(scans)
      .set({
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      })
      .where(eq(scans.id, scanId))
    throw error
  }
}
