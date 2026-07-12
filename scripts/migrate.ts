import { Pool } from "pg"
import "dotenv/config"

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  })

  console.log("Creating subscriptions tables...")

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "subscriptions" (
      "id" text PRIMARY KEY NOT NULL,
      "userId" text NOT NULL,
      "vendorNormalized" text NOT NULL,
      "cadence" text NOT NULL,
      "confidence" real NOT NULL,
      "firstChargeDate" date NOT NULL,
      "lastChargeDate" date NOT NULL,
      "nextExpectedDate" date,
      "currentAmountCents" integer NOT NULL,
      "currency" text DEFAULT 'USD' NOT NULL,
      "averageAmountCents" integer NOT NULL,
      "totalCharges" integer NOT NULL,
      "status" text DEFAULT 'active' NOT NULL,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL,
      "analyzedAt" timestamp DEFAULT now() NOT NULL
    );
  `)
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "subscription_alerts" (
      "id" text PRIMARY KEY NOT NULL,
      "userId" text NOT NULL,
      "subscriptionId" text,
      "type" text NOT NULL,
      "severity" text DEFAULT 'info' NOT NULL,
      "details" jsonb NOT NULL,
      "dismissed" boolean DEFAULT false NOT NULL,
      "dismissedAt" timestamp,
      "createdAt" timestamp DEFAULT now() NOT NULL
    );
  `)

  // Add foreign keys (using IF NOT EXISTS is hard in PG, so we will try/catch)
  try {
    await pool.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;`)
    await pool.query(`ALTER TABLE "subscription_alerts" ADD CONSTRAINT "subscription_alerts_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;`)
    await pool.query(`ALTER TABLE "subscription_alerts" ADD CONSTRAINT "subscription_alerts_subscriptionId_subscriptions_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;`)
  } catch (e) {
    console.log("Constraints might already exist, ignoring:", e.message)
  }

  try {
    await pool.query(`CREATE INDEX IF NOT EXISTS "subscriptions_userId_idx" ON "subscriptions" USING btree ("userId");`)
    await pool.query(`CREATE INDEX IF NOT EXISTS "subscriptions_userId_status_idx" ON "subscriptions" USING btree ("userId","status");`)
    await pool.query(`CREATE INDEX IF NOT EXISTS "subscription_alerts_userId_idx" ON "subscription_alerts" USING btree ("userId");`)
    await pool.query(`CREATE INDEX IF NOT EXISTS "subscription_alerts_userId_dismissed_idx" ON "subscription_alerts" USING btree ("userId","dismissed");`)
  } catch(e) {
     console.log("Indexes might already exist, ignoring:", e.message)
  }

  console.log("Schema changes applied successfully!")
  process.exit(0)
}

run().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
