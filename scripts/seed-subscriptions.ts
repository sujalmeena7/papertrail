import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "../lib/db/schema"
import { randomUUID } from "crypto"
import "dotenv/config"
import { eq } from "drizzle-orm"
async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set")
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  })

  const db = drizzle(pool, { schema })

  console.log("Fetching user by email...")
  const user = await db.query.user.findFirst({
    where: eq(schema.user.email, "meenasujal60@gmail.com")
  })
  if (!user) {
    console.log("No user found with that email. Please sign in to the app first.")
    process.exit(1)
  }

  const userId = user.id
  console.log(`Seeding subscriptions for user ${userId}...`)

  // We need to create a history of receipts for the last 6 months
  const now = new Date()
  const receiptsToInsert: schema.NewReceipt[] = []

  // 1. Monthly Subscription: AWS (Stable price, then a hike)
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now)
    date.setMonth(date.getMonth() - i)
    date.setDate(5) // 5th of every month
    
    // Price hike in the most recent month
    const amountCents = i === 0 ? 5500 : 4500 // $45 -> $55

    receiptsToInsert.push({
      id: randomUUID(),
      userId,
      source: "gmail",
      receiptDate: date.toISOString().split("T")[0],
      amountCents,
      currency: "USD",
      vendor: "Amazon Web Services",
      vendorNormalized: "amazon web services",
      category: "hosting",
      extractedItems: [],
      subject: "AWS Invoice",
      fromEmail: "no-reply-aws@amazon.com",
    })
  }

  // 2. Monthly Subscription: Figma (Stable price)
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now)
    date.setMonth(date.getMonth() - i)
    date.setDate(12) 
    
    receiptsToInsert.push({
      id: randomUUID(),
      userId,
      source: "gmail",
      receiptDate: date.toISOString().split("T")[0],
      amountCents: 1500, // $15
      currency: "USD",
      vendor: "Figma",
      vendorNormalized: "figma",
      category: "software",
      extractedItems: [],
      subject: "Your Figma receipt",
      fromEmail: "billing@figma.com",
    })
  }

  // 3. Annual Subscription (Missed Renewal): Notion
  // Expected to renew last month, but didn't
  for (let i = 2; i >= 1; i--) {
    const date = new Date(now)
    date.setFullYear(date.getFullYear() - i)
    date.setMonth(date.getMonth() - 1) // Should have renewed last month
    date.setDate(20)
    
    receiptsToInsert.push({
      id: randomUUID(),
      userId,
      source: "gmail",
      receiptDate: date.toISOString().split("T")[0],
      amountCents: 9600, // $96
      currency: "USD",
      vendor: "Notion",
      vendorNormalized: "notion",
      category: "software",
      extractedItems: [],
      subject: "Notion Annual Plan",
      fromEmail: "billing@notion.so",
    })
  }

  // 4. One-off / Irregular: Apple
  receiptsToInsert.push({
    id: randomUUID(),
    userId,
    source: "gmail",
    receiptDate: now.toISOString().split("T")[0],
    amountCents: 249900, // $2499
    currency: "USD",
    vendor: "Apple Store",
    vendorNormalized: "apple",
    category: "hardware",
    extractedItems: [],
    subject: "Your Apple receipt",
    fromEmail: "no-reply@apple.com",
  })

  // 5. Multi-currency group test: Framer (EUR)
  for (let i = 3; i >= 0; i--) {
    const date = new Date(now)
    date.setMonth(date.getMonth() - i)
    date.setDate(1) 
    
    receiptsToInsert.push({
      id: randomUUID(),
      userId,
      source: "gmail",
      receiptDate: date.toISOString().split("T")[0],
      amountCents: 2000, 
      currency: "EUR",
      vendor: "Framer",
      vendorNormalized: "framer",
      category: "software",
      extractedItems: [],
      subject: "Your Framer receipt",
      fromEmail: "billing@framer.com",
    })
  }

  console.log(`Inserting ${receiptsToInsert.length} dummy receipts...`)
  await db.insert(schema.receipts).values(receiptsToInsert)

  console.log("Done seeding receipts!")
  process.exit(0)
}

run().catch((err) => {
  console.error("Failed to seed:", err)
  process.exit(1)
})
