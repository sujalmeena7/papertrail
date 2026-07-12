import { db } from "@/lib/db"
import { bankTransactions, receipts, subscriptions } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { randomUUID } from "crypto"
import { Transaction } from "plaid"
import { normalizeVendor } from "@/lib/pipeline/normalize"

// A simple Levenshtein distance function for string similarity
function getEditDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  
  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null))
  
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j
  
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i][j - 1] + 1,
        matrix[i - 1][j] + 1,
        matrix[i - 1][j - 1] + indicator
      )
    }
  }
  return matrix[a.length][b.length]
}

function getStringSimilarity(a: string, b: string): number {
  const distance = getEditDistance(a, b)
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1.0
  return 1 - distance / maxLen
}

export async function reconcileBankTransactions(
  userId: string,
  bankConnectionId: string,
  transactions: Transaction[]
) {
  // 1. Fetch all user receipts to match against
  const userReceipts = await db.query.receipts.findMany({
    where: eq(receipts.userId, userId)
  })

  // 2. Fetch existing bank transactions for idempotency
  const existingTxList = await db.query.bankTransactions.findMany({
    where: and(
      eq(bankTransactions.userId, userId),
      eq(bankTransactions.bankConnectionId, bankConnectionId)
    )
  })
  const existingTxIds = new Set(existingTxList.map(tx => tx.plaidTransactionId))

  const newBankTxs = []

  // 3. Process each incoming transaction
  for (const tx of transactions) {
    if (existingTxIds.has(tx.transaction_id)) continue // Skip if already synced

    const rawMerchant = tx.merchant_name || tx.name || "Unknown Merchant"
    const normalizedMerchant = normalizeVendor(rawMerchant)
    // Plaid amounts are in dollars, schema uses cents
    const amountCents = Math.round(tx.amount * 100) 
    
    let matchedReceiptId = null
    let matchConfidence = 0

    // Exact matching logic
    for (const r of userReceipts) {
      const amountDiff = Math.abs(r.amountCents - amountCents)
      // Check if dates are within ±3 days
      const rDate = new Date(r.receiptDate).getTime()
      const txDate = new Date(tx.date).getTime()
      const daysDiff = Math.abs(rDate - txDate) / (1000 * 60 * 60 * 24)

      if (daysDiff <= 3) {
        if (r.vendorNormalized === normalizedMerchant && amountDiff === 0) {
          matchedReceiptId = r.id
          matchConfidence = 1.0
          break
        } else if (amountCents > 0) {
          // Fuzzy match — keep the best-scoring candidate seen so far instead
          // of whichever one happens to be last in userReceipts.
          const similarity = getStringSimilarity(r.vendorNormalized, normalizedMerchant)
          if (
            similarity > 0.8 &&
            amountDiff / amountCents < 0.05 &&
            similarity > matchConfidence
          ) {
            matchedReceiptId = r.id
            matchConfidence = similarity
            // Don't break immediately, keep looking for exact match
          }
        }
      }
    }

    newBankTxs.push({
      id: randomUUID(),
      userId,
      bankConnectionId,
      plaidTransactionId: tx.transaction_id,
      merchantName: normalizedMerchant,
      merchantNameRaw: rawMerchant,
      amountCents,
      currency: tx.iso_currency_code || "USD",
      transactionDate: tx.date,
      category: tx.category?.[0] || null,
      pending: tx.pending,
      matchedReceiptId,
      matchConfidence: matchedReceiptId ? matchConfidence : null,
      isStealthSubscription: false,
    })
  }

  if (newBankTxs.length > 0) {
    await db.insert(bankTransactions).values(newBankTxs)
  }

  // 4. Stealth Detection
  // Group unmatched transactions by normalized merchant
  const allBankTxs = await db.query.bankTransactions.findMany({
    where: and(
      eq(bankTransactions.userId, userId),
      eq(bankTransactions.bankConnectionId, bankConnectionId)
    )
  })

  const unmatched = allBankTxs.filter(t => !t.matchedReceiptId)
  
  const byMerchant = new Map<string, typeof unmatched>()
  for (const t of unmatched) {
    if (!byMerchant.has(t.merchantName!)) byMerchant.set(t.merchantName!, [])
    byMerchant.get(t.merchantName!)!.push(t)
  }

  const stealthCandidates = []

  for (const [merchant, txs] of byMerchant.entries()) {
    if (txs.length < 2) continue

    // Check if they look like a recurring subscription: similar amounts and
    // spacing that isn't same-day noise or a one-off coincidence.
    const sorted = [...txs].sort(
      (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    )
    const amounts = sorted.map((t) => t.amountCents)
    const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length
    const amountsSimilar =
      avgAmount > 0 && amounts.every((a) => Math.abs(a - avgAmount) / avgAmount < 0.15)

    const daysBetween: number[] = []
    for (let i = 1; i < sorted.length; i++) {
      const diff =
        (new Date(sorted[i].transactionDate).getTime() -
          new Date(sorted[i - 1].transactionDate).getTime()) /
        (1000 * 60 * 60 * 24)
      daysBetween.push(diff)
    }
    // Recurring charges land roughly weekly-to-annual apart, not same-day
    // duplicates or a random single overlap.
    const spacingLooksRecurring = daysBetween.every((d) => d >= 5 && d <= 400)

    if (amountsSimilar && spacingLooksRecurring) {
      for (const t of sorted) {
        if (!t.isStealthSubscription) {
          stealthCandidates.push(t.id)
        }
      }
    }
  }

  if (stealthCandidates.length > 0) {
    // Update them to be stealth subscriptions
    // We do this in a loop because we can't easily bulk update an array of IDs in basic Drizzle without 'inArray' (which is available but let's stick to simple loops for MVP or import it)
    for (const id of stealthCandidates) {
      await db.update(bankTransactions)
        .set({ isStealthSubscription: true })
        .where(eq(bankTransactions.id, id))
    }
  }
}
