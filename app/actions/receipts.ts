"use server"

import { randomUUID } from "crypto"
import { db } from "@/lib/db"
import { receipts, scans } from "@/lib/db/schema"
import { normalizeVendor } from "@/lib/pipeline/normalize"
import { runScan } from "@/lib/pipeline/scan"
import { fixtureSource } from "@/lib/pipeline/sources/fixture"
import { createGmailSource } from "@/lib/pipeline/sources/gmail"
import { gmailConnections } from "@/lib/db/schema"
import { decrypt, encrypt } from "@/lib/encryption"
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId as getUserId } from "@/lib/session"

const PAGE_SIZE = 20

function buildReceiptConditions(userId: string, query?: string, category?: string) {
  const conditions = [eq(receipts.userId, userId)]

  if (query && query.trim()) {
    const q = `%${query.trim()}%`
    conditions.push(
      or(
        ilike(receipts.vendor, q),
        ilike(receipts.invoiceNumber, q),
        ilike(receipts.rawSubject, q),
      )!,
    )
  }
  if (category && category !== "all") {
    conditions.push(eq(receipts.category, category))
  }

  return and(...conditions)
}

export async function getReceipts(query?: string, category?: string) {
  const userId = await getUserId()
  const conditions = buildReceiptConditions(userId, query, category)

  return db
    .select()
    .from(receipts)
    .where(conditions)
    .orderBy(desc(receipts.receiptDate), desc(receipts.createdAt))
}

export async function getReceiptsPaginated(
  page = 0,
  query?: string,
  category?: string,
) {
  const userId = await getUserId()
  const conditions = buildReceiptConditions(userId, query, category)

  const [rows, total] = await Promise.all([
    db
      .select()
      .from(receipts)
      .where(conditions)
      .orderBy(desc(receipts.receiptDate), desc(receipts.createdAt))
      .limit(PAGE_SIZE)
      .offset(page * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(receipts)
      .where(conditions),
  ])

  return {
    receipts: rows,
    total: total[0]?.count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil((total[0]?.count ?? 0) / PAGE_SIZE)),
  }
}

export async function deleteReceipt(id: string) {
  const userId = await getUserId()
  await db
    .delete(receipts)
    .where(and(eq(receipts.id, id), eq(receipts.userId, userId)))
  revalidatePath("/")
}

export async function deleteReceipts(ids: string[]) {
  const userId = await getUserId()
  if (!ids.length) return
  await db
    .delete(receipts)
    .where(and(inArray(receipts.id, ids), eq(receipts.userId, userId)))
  revalidatePath("/")
}

export async function addManualReceipt(input: {
  vendor: string
  amountCents: number
  currency: string
  receiptDate: string
  invoiceNumber?: string
  category: string
  notes?: string
}) {
  const userId = await getUserId()
  const vendor = input.vendor.trim()
  if (!vendor) throw new Error("Vendor is required")
  if (!Number.isFinite(input.amountCents) || input.amountCents <= 0) {
    throw new Error("Amount must be positive")
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.receiptDate)) {
    throw new Error("Invalid date")
  }

  await db.insert(receipts).values({
    id: randomUUID(),
    userId,
    vendor,
    vendorNormalized: normalizeVendor(vendor),
    amountCents: Math.round(input.amountCents),
    currency: input.currency || "USD",
    receiptDate: input.receiptDate,
    invoiceNumber: input.invoiceNumber?.trim() || null,
    category: input.category || "other",
    source: "upload",
    notes: input.notes?.trim() || null,
    confidence: 1,
  })
  revalidatePath("/")
  revalidatePath("/subscriptions")
}

export async function startDemoScan() {
  const userId = await getUserId()
  const { stats } = await runScan(userId, fixtureSource)
  revalidatePath("/")
  revalidatePath("/subscriptions")
  return stats
}

export async function startGmailScan() {
  const userId = await getUserId()

  const [connection] = await db
    .select()
    .from(gmailConnections)
    .where(eq(gmailConnections.userId, userId))
    .limit(1)

  if (!connection) {
    throw new Error("Gmail not connected")
  }

  let accessToken = decrypt(connection.encryptedAccessToken ?? "") as string
  if (!accessToken) {
    throw new Error("Invalid access token")
  }

  // Refresh token if expired or expiring within 5 minutes
  if (
    connection.tokenExpiresAt &&
    connection.tokenExpiresAt.getTime() < Date.now() + 5 * 60000
  ) {
    const refreshToken = decrypt(connection.encryptedRefreshToken ?? "")
    if (!refreshToken) {
      throw new Error("Invalid refresh token")
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret)
      throw new Error("Missing Google OAuth credentials")

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })

    if (!tokenRes.ok) {
      throw new Error("Failed to refresh Gmail token")
    }

    const tokens = await tokenRes.json()
    accessToken = tokens.access_token

    await db
      .update(gmailConnections)
      .set({
        encryptedAccessToken: encrypt(tokens.access_token),
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        updatedAt: new Date(),
      })
      .where(eq(gmailConnections.id, connection.id))
  }

  const source = createGmailSource(accessToken)

  // Use last scan date for incremental scans
  const after = connection.lastScanAt
    ? new Date(connection.lastScanAt)
    : undefined

  // Keep interactive scans snappy: 50 emails per click. Re-scanning is
  // incremental (uses lastScanAt), so repeated scans keep pulling newer mail.
  const { stats } = await runScan(userId, source, { after, max: 50 })

  await db
    .update(gmailConnections)
    .set({
      lastScanAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(gmailConnections.id, connection.id))

  revalidatePath("/")
  revalidatePath("/subscriptions")
  return stats
}

/** Enqueue a scan record (status: "pending") and return its id. The scan
 *  worker (API route) picks it up and runs it in the background. */
export async function enqueueScan() {
  const userId = await getUserId()
  const source = (await db
    .select({ id: gmailConnections.userId })
    .from(gmailConnections)
    .where(eq(gmailConnections.userId, userId))
    .limit(1)
  ).length
    ? "gmail"
    : "fixture"

  const scanId = randomUUID()
  await db.insert(scans).values({
    id: scanId,
    userId,
    status: "pending",
    source,
  })

  revalidatePath("/")
  revalidatePath("/subscriptions")
  return { scanId }
}

/** Poll the latest scan record for the current user (used by the client to
 *  watch enqueued scan progress). */
export async function pollLatestScan() {
  const userId = await getUserId()
  const [latest] = await db
    .select()
    .from(scans)
    .where(eq(scans.userId, userId))
    .orderBy(desc(scans.startedAt))
    .limit(1)

  return latest ?? null
}

export async function disconnectGmail() {
  const userId = await getUserId()
  await db.delete(gmailConnections).where(eq(gmailConnections.userId, userId))
  revalidatePath("/settings")
  revalidatePath("/")
}

export async function getScans() {
  const userId = await getUserId()
  return db
    .select()
    .from(scans)
    .where(eq(scans.userId, userId))
    .orderBy(desc(scans.startedAt))
    .limit(10)
}

export async function getAnalytics() {
  const userId = await getUserId()

  const [totals, byVendor, byCategory, byMonth] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)::int`,
        totalCents: sql<number>`coalesce(sum(${receipts.amountCents}), 0)::bigint`,
      })
      .from(receipts)
      .where(eq(receipts.userId, userId)),

    db
      .select({
        vendor: receipts.vendorNormalized,
        count: sql<number>`count(*)::int`,
        totalCents: sql<number>`sum(${receipts.amountCents})::bigint`,
      })
      .from(receipts)
      .where(eq(receipts.userId, userId))
      .groupBy(receipts.vendorNormalized)
      .orderBy(desc(sql`sum(${receipts.amountCents})::bigint`))
      .limit(8),

    db
      .select({
        category: receipts.category,
        count: sql<number>`count(*)::int`,
        totalCents: sql<number>`sum(${receipts.amountCents})::bigint`,
      })
      .from(receipts)
      .where(eq(receipts.userId, userId))
      .groupBy(receipts.category)
      .orderBy(desc(sql`sum(${receipts.amountCents})::bigint`)),

    db
      .select({
        month: sql<string>`to_char(${receipts.receiptDate}, 'YYYY-MM')`,
        totalCents: sql<number>`sum(${receipts.amountCents})::bigint`,
        count: sql<number>`count(*)::int`,
      })
      .from(receipts)
      .where(eq(receipts.userId, userId))
      .groupBy(sql`to_char(${receipts.receiptDate}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${receipts.receiptDate}, 'YYYY-MM')`),
  ])

  return {
    count: Number(totals[0]?.count ?? 0),
    totalCents: Number(totals[0]?.totalCents ?? 0),
    byVendor: byVendor.map((v: any) => ({ ...v, totalCents: Number(v.totalCents) })),
    byCategory: byCategory.map((c: any) => ({
      ...c,
      totalCents: Number(c.totalCents),
    })),
    byMonth: byMonth.map((m: any) => ({ ...m, totalCents: Number(m.totalCents) })),
  }
}
