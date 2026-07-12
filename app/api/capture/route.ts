import { randomUUID, createHash } from "crypto"
import { db } from "@/lib/db"
import { deviceTokens, receipts } from "@/lib/db/schema"
import { normalizeVendor } from "@/lib/pipeline/normalize"
import { eq } from "drizzle-orm"
import { z } from "zod"

const captureSchema = z.object({
  vendor: z.string().min(1).max(200),
  amountCents: z.number().int().positive(),
  currency: z.string().min(3).max(3).default("USD"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  invoiceNumber: z.string().max(200).nullish(),
  sourceUrl: z.string().url().max(2000).nullish(),
  // Matches the app-wide taxonomy used by the dashboard and the Gmail-scan
  // pipeline (see lib/pipeline/classify.ts), so receipts from every source
  // share one category vocabulary.
  category: z
    .enum([
      "cloud",
      "saas",
      "ai",
      "domains",
      "payments",
      "design",
      "productivity",
      "marketing",
      "other",
    ])
    .default("other"),
})

/**
 * Portal capture endpoint — the future Chrome extension POSTs here with a
 * device token. Also usable via curl for testing.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null
  if (!token) {
    return Response.json({ error: "Missing device token" }, { status: 401 })
  }

  const tokenHash = createHash("sha256").update(token).digest("hex")
  const [device] = await db
    .select()
    .from(deviceTokens)
    .where(eq(deviceTokens.tokenHash, tokenHash))
    .limit(1)
  if (!device) {
    return Response.json({ error: "Invalid device token" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = captureSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const data = parsed.data
  const id = randomUUID()

  await db.insert(receipts).values({
    id,
    userId: device.userId,
    vendor: data.vendor,
    vendorNormalized: normalizeVendor(data.vendor),
    amountCents: data.amountCents,
    currency: data.currency.toUpperCase(),
    receiptDate: data.date,
    invoiceNumber: data.invoiceNumber ?? null,
    category: data.category,
    source: "portal",
    sourceUrl: data.sourceUrl ?? null,
    confidence: 1,
  })

  await db
    .update(deviceTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(deviceTokens.id, device.id))

  return Response.json({ ok: true, receiptId: id }, { status: 201 })
}
