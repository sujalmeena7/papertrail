import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { receipts } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { headers } from "next/headers"

function csvEscape(value: string | null | undefined): string {
  if (value == null) return ""
  const s = String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const rows = await db
    .select()
    .from(receipts)
    .where(eq(receipts.userId, session.user.id))
    .orderBy(desc(receipts.receiptDate))

  const header = [
    "Date",
    "Vendor",
    "Amount",
    "Currency",
    "Category",
    "Invoice Number",
    "Source",
    "Notes",
  ].join(",")

  const lines = rows.map((r) =>
    [
      r.receiptDate,
      csvEscape(r.vendor),
      (r.amountCents / 100).toFixed(2),
      r.currency,
      r.category,
      csvEscape(r.invoiceNumber),
      r.source,
      csvEscape(r.notes),
    ].join(","),
  )

  const csv = [header, ...lines].join("\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="papertrail-receipts-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
