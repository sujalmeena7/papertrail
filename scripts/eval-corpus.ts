/**
 * Eval runner: scores the detection pipeline against the labeled corpus.
 *
 * Run with: npx tsx scripts/eval-corpus.ts
 *
 * Reports (criteria A & B):
 *  - Detection: precision / recall / F1 on isReceipt
 *  - Extraction: field accuracy (vendor, amount, currency, date, invoice #)
 *    on true positives
 *  - Prefilter: how many true receipts the cheap filter would lose
 */
import { corpus } from "../fixtures/emails/corpus"
import { classifyEmail } from "../lib/pipeline/classify"
import { normalizeVendor } from "../lib/pipeline/normalize"
import { prefilterEmail } from "../lib/pipeline/prefilter"

const CONCURRENCY = 5

interface EvalRow {
  id: string
  expected: boolean
  prefilterPass: boolean
  predicted: boolean
  vendorOk?: boolean
  amountOk?: boolean
  currencyOk?: boolean
  dateOk?: boolean
  invoiceOk?: boolean
  detail?: string
}

async function main() {
  console.log(`Evaluating ${corpus.length} emails...\n`)
  const rows: EvalRow[] = []

  for (let i = 0; i < corpus.length; i += CONCURRENCY) {
    const batch = corpus.slice(i, i + CONCURRENCY)
    const settled = await Promise.allSettled(
      batch.map(async (item) => {
        const pre = prefilterEmail(item.email)
        // Pipeline behavior: emails failing prefilter are never classified.
        const result = pre.pass
          ? await classifyEmail(item.email)
          : ({ isReceipt: false, reason: "prefiltered" } as const)

        const row: EvalRow = {
          id: item.email.id,
          expected: item.expected.isReceipt,
          prefilterPass: pre.pass,
          predicted: result.isReceipt,
        }

        if (result.isReceipt && item.expected.isReceipt) {
          row.vendorOk =
            normalizeVendor(result.vendor) === item.expected.vendor
          row.amountOk = result.amountCents === item.expected.amountCents
          row.currencyOk = result.currency === item.expected.currency
          row.dateOk = result.date === item.expected.date
          row.invoiceOk =
            (result.invoiceNumber ?? null) ===
            (item.expected.invoiceNumber ?? null)
          row.detail = `${result.vendor} | ${result.amountCents} ${result.currency} | ${result.date} | ${result.invoiceNumber}`
        } else if (result.isReceipt !== item.expected.isReceipt) {
          row.detail = result.isReceipt
            ? `FALSE POSITIVE: ${(result as { vendor: string }).vendor}`
            : `FALSE NEGATIVE: ${(result as { reason?: string }).reason ?? ""}`
        }
        return row
      }),
    )
    for (const s of settled) {
      if (s.status === "fulfilled") rows.push(s.value)
      else console.error("  classify error:", s.reason)
    }
    process.stdout.write(`  ${Math.min(i + CONCURRENCY, corpus.length)}/${corpus.length}\r`)
  }

  // --- Detection metrics ---
  const tp = rows.filter((r) => r.expected && r.predicted).length
  const fp = rows.filter((r) => !r.expected && r.predicted).length
  const fn = rows.filter((r) => r.expected && !r.predicted).length
  const tn = rows.filter((r) => !r.expected && !r.predicted).length
  const precision = tp / (tp + fp || 1)
  const recall = tp / (tp + fn || 1)
  const f1 = (2 * precision * recall) / (precision + recall || 1)

  // --- Prefilter loss ---
  const prefilterLoss = rows.filter((r) => r.expected && !r.prefilterPass)

  // --- Extraction accuracy on true positives ---
  const tpRows = rows.filter((r) => r.expected && r.predicted)
  const pct = (k: keyof EvalRow) =>
    ((tpRows.filter((r) => r[k] === true).length / (tpRows.length || 1)) * 100).toFixed(1)

  console.log("\n=== DETECTION (criterion A) ===")
  console.log(`TP=${tp} FP=${fp} FN=${fn} TN=${tn}`)
  console.log(`Precision: ${(precision * 100).toFixed(1)}%  (target ≥95%)`)
  console.log(`Recall:    ${(recall * 100).toFixed(1)}%  (target ≥90%)`)
  console.log(`F1:        ${(f1 * 100).toFixed(1)}%`)

  console.log("\n=== PREFILTER ===")
  console.log(`True receipts lost by prefilter: ${prefilterLoss.length}`)
  for (const r of prefilterLoss) console.log(`  - ${r.id}`)

  console.log("\n=== EXTRACTION on true positives (criterion B) ===")
  console.log(`Vendor:   ${pct("vendorOk")}%`)
  console.log(`Amount:   ${pct("amountOk")}%`)
  console.log(`Currency: ${pct("currencyOk")}%`)
  console.log(`Date:     ${pct("dateOk")}%`)
  console.log(`Invoice#: ${pct("invoiceOk")}%`)

  console.log("\n=== ERRORS ===")
  for (const r of rows.filter((x) => x.expected !== x.predicted)) {
    console.log(`  ${r.id}: ${r.detail}`)
  }
  const fieldMisses = tpRows.filter(
    (r) => !(r.vendorOk && r.amountOk && r.currencyOk && r.dateOk && r.invoiceOk),
  )
  if (fieldMisses.length) {
    console.log("\n=== FIELD MISSES ===")
    for (const r of fieldMisses) {
      const bad = (["vendorOk", "amountOk", "currencyOk", "dateOk", "invoiceOk"] as const)
        .filter((k) => r[k] !== true)
        .join(", ")
      console.log(`  ${r.id}: ${bad} → ${r.detail}`)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
