import { randomUUID } from "crypto"
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  date,
  index,
  jsonb,
} from "drizzle-orm/pg-core"

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_userId_idx").on(t.userId)],
)

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (t) => [index("account_userId_idx").on(t.userId)],
)

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// --- App tables ------------------------------------------------------------

export const receipts = pgTable(
  "receipts",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    vendor: text("vendor").notNull(),
    vendorNormalized: text("vendorNormalized").notNull(),
    amountCents: integer("amountCents").notNull(),
    currency: text("currency").notNull().default("USD"),
    receiptDate: date("receiptDate").notNull(),
    invoiceNumber: text("invoiceNumber"),
    category: text("category").notNull().default("other"),
    source: text("source").notNull().default("gmail"), // gmail | fixture | portal | upload
    sourceRef: text("sourceRef"), // e.g. gmail message id / fixture id — idempotency key
    sourceUrl: text("sourceUrl"),
    blobUrl: text("blobUrl"),
    blobPathname: text("blobPathname"),
    confidence: real("confidence"),
    rawSubject: text("rawSubject"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (t) => [
    // Matches the dashboard's list query: filter by userId, order by date desc.
    index("receipts_userId_date_idx").on(t.userId, t.receiptDate.desc()),
  ],
)

export const scans = pgTable(
  "scans",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    status: text("status").notNull().default("pending"), // pending | running | completed | failed
    source: text("source").notNull().default("fixture"), // fixture | gmail
    emailsScanned: integer("emailsScanned").notNull().default(0),
    emailsMatched: integer("emailsMatched").notNull().default(0),
    receiptsCreated: integer("receiptsCreated").notNull().default(0),
    receiptsSkipped: integer("receiptsSkipped").notNull().default(0),
    error: text("error"),
    startedAt: timestamp("startedAt").notNull().defaultNow(),
    completedAt: timestamp("completedAt"),
  },
  (t) => [index("scans_userId_startedAt_idx").on(t.userId, t.startedAt.desc())],
)

export const gmailConnections = pgTable(
  "gmail_connections",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    email: text("email").notNull(),
    encryptedAccessToken: text("encryptedAccessToken"),
    encryptedRefreshToken: text("encryptedRefreshToken"),
    tokenExpiresAt: timestamp("tokenExpiresAt"),
    status: text("status").notNull().default("disconnected"), // disconnected | connected | error
    lastScanAt: timestamp("lastScanAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (t) => [index("gmail_connections_userId_idx").on(t.userId)],
)

export const deviceTokens = pgTable(
  "device_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    tokenHash: text("tokenHash").notNull().unique(),
    tokenPrefix: text("tokenPrefix").notNull(),
    label: text("label").notNull().default("Chrome extension"),
    lastUsedAt: timestamp("lastUsedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("device_tokens_userId_idx").on(t.userId)],
)

export type Receipt = typeof receipts.$inferSelect
export type NewReceipt = typeof receipts.$inferInsert
export type Scan = typeof scans.$inferSelect
export type GmailConnection = typeof gmailConnections.$inferSelect
export type DeviceToken = typeof deviceTokens.$inferSelect

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    vendorNormalized: text("vendorNormalized").notNull(),

    // Detection metadata
    cadence: text("cadence").notNull(), // 'monthly' | 'annual' | 'quarterly' | 'irregular'
    confidence: real("confidence").notNull(), // 0-1
    firstChargeDate: date("firstChargeDate").notNull(),
    lastChargeDate: date("lastChargeDate").notNull(),
    nextExpectedDate: date("nextExpectedDate"),

    // Spend summary
    currentAmountCents: integer("currentAmountCents").notNull(),
    currency: text("currency").notNull().default("USD"),
    averageAmountCents: integer("averageAmountCents").notNull(),
    totalCharges: integer("totalCharges").notNull(),

    status: text("status").notNull().default("active"), // 'active' | 'cancelled' | 'paused'

    lastActivityAt: timestamp("lastActivityAt"),

    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    analyzedAt: timestamp("analyzedAt").notNull().defaultNow(),
  },
  (t) => [
    index("subscriptions_userId_idx").on(t.userId),
    index("subscriptions_userId_status_idx").on(t.userId, t.status), // drizzle-orm supports basic indexes, partial indexing needs .where(sql`status = 'active'`) but let's keep it simple
  ]
)

export const subscriptionAlerts = pgTable(
  "subscription_alerts",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    subscriptionId: text("subscriptionId")
      .references(() => subscriptions.id, { onDelete: "cascade" }),
      
    type: text("type").notNull(), // 'price_hike' | 'missed_renewal' | 'duplicate' | 'zombie'
    severity: text("severity").notNull().default("info"), // 'info' | 'warning' | 'critical'
    
    details: jsonb("details").notNull(),
    
    dismissed: boolean("dismissed").notNull().default(false),
    dismissedAt: timestamp("dismissedAt"),
    
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [
    index("subscription_alerts_userId_idx").on(t.userId),
    index("subscription_alerts_userId_dismissed_idx").on(t.userId, t.dismissed),
  ]
)

export type Subscription = typeof subscriptions.$inferSelect
export type SubscriptionAlert = typeof subscriptionAlerts.$inferSelect

export const bankConnections = pgTable("bank_connections", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  institutionName: text("institutionName").notNull(),
  institutionId: text("institutionId"),
  encryptedAccessToken: text("encryptedAccessToken").notNull(),
  accountMask: text("accountMask"),
  accountName: text("accountName"),
  accountType: text("accountType"),
  lastSyncAt: timestamp("lastSyncAt"),
  status: text("status").notNull().default("connected"), // 'connected' | 'error' | 'disconnected'
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (t) => [
  index("bank_connections_userId_idx").on(t.userId),
])

export const bankTransactions = pgTable("bank_transactions", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  bankConnectionId: text("bankConnectionId").notNull()
    .references(() => bankConnections.id, { onDelete: "cascade" }),
  plaidTransactionId: text("plaidTransactionId").notNull().unique(),
  merchantName: text("merchantName"),
  merchantNameRaw: text("merchantNameRaw"),
  amountCents: integer("amountCents").notNull(),
  currency: text("currency").notNull().default("USD"),
  transactionDate: date("transactionDate").notNull(),
  category: text("category"),
  pending: boolean("pending").notNull().default(false),
  
  matchedReceiptId: text("matchedReceiptId").references(() => receipts.id, { onDelete: "set null" }),
  matchedSubscriptionId: text("matchedSubscriptionId").references(() => subscriptions.id, { onDelete: "set null" }),
  matchConfidence: real("matchConfidence"),
  isStealthSubscription: boolean("isStealthSubscription").notNull().default(false),
  
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (t) => [
  index("bank_transactions_userId_idx").on(t.userId),
  index("bank_transactions_bankConnectionId_idx").on(t.bankConnectionId),
])

export const subscriptionUsage = pgTable("subscription_usage", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  subscriptionId: text("subscriptionId").notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  
  lastUsedAt: timestamp("lastUsedAt"),
  usageStatus: text("usageStatus").notNull().default("unknown"), // 'active_daily' | 'active_weekly' | 'active_monthly' | 'rarely' | 'never' | 'unknown'
  
  lastLoginDetected: timestamp("lastLoginDetected"),
  loginSource: text("loginSource"),
  
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (t) => [
  index("subscription_usage_subscriptionId_idx").on(t.subscriptionId),
])

export const notificationPreferences = pgTable("notification_preferences", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }).unique(),
  renewalAlertsEnabled: boolean("renewal_alerts_enabled").notNull().default(true),
  renewalAlertDaysBefore: integer("renewal_alert_days_before").notNull().default(3),
  weeklyDigestEnabled: boolean("weekly_digest_enabled").notNull().default(true),
  lastDigestSentAt: timestamp("last_digest_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const sentNotifications = pgTable(
  "sent_notifications",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    subscriptionId: text("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    sentAt: timestamp("sent_at").notNull().defaultNow(),
  },
  (table) => [
    index("sent_notifications_user_id_idx").on(table.userId),
    index("sent_notifications_dedupe_idx").on(table.subscriptionId, table.type, table.sentAt),
  ]
)

// --- Billing (Phase 3) -----------------------------------------------------
// One row per user tracking their PaperTrail Pro plan. Kept separate from the
// Better Auth `user` table to avoid coupling. Price/currency live in the
// Razorpay Plan (INR ₹999/mo), not here.

export const billing = pgTable("billing", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }).unique(),
  plan: text("plan").notNull().default("free"), // 'free' | 'pro'
  status: text("status").notNull().default("none"), // 'none' | 'active' | 'past_due' | 'cancelled'
  razorpayCustomerId: text("razorpay_customer_id"),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end"), // pro persists until this passes even if cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("billing_user_id_idx").on(t.userId),
])

// Idempotency ledger for Razorpay webhook events — dedupe on the event id so a
// redelivered webhook is processed exactly once.
export const billingEvents = pgTable("billing_events", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  eventId: text("event_id").notNull().unique(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull(),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
})

export type BankConnection = typeof bankConnections.$inferSelect
export type BankTransaction = typeof bankTransactions.$inferSelect
export type SubscriptionUsage = typeof subscriptionUsage.$inferSelect
export type NotificationPreferences = typeof notificationPreferences.$inferSelect
export type SentNotification = typeof sentNotifications.$inferSelect
export type Billing = typeof billing.$inferSelect
export type BillingEvent = typeof billingEvents.$inferSelect
