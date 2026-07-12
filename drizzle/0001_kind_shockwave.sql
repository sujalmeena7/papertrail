CREATE TABLE "bank_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"institutionName" text NOT NULL,
	"institutionId" text,
	"encryptedAccessToken" text NOT NULL,
	"accountMask" text,
	"accountName" text,
	"accountType" text,
	"lastSyncAt" timestamp,
	"status" text DEFAULT 'connected' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"bankConnectionId" text NOT NULL,
	"plaidTransactionId" text NOT NULL,
	"merchantName" text,
	"merchantNameRaw" text,
	"amountCents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"transactionDate" date NOT NULL,
	"category" text,
	"pending" boolean DEFAULT false NOT NULL,
	"matchedReceiptId" text,
	"matchedSubscriptionId" text,
	"matchConfidence" real,
	"isStealthSubscription" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bank_transactions_plaidTransactionId_unique" UNIQUE("plaidTransactionId")
);
--> statement-breakpoint
CREATE TABLE "subscription_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"subscriptionId" text NOT NULL,
	"lastUsedAt" timestamp,
	"usageStatus" text DEFAULT 'unknown' NOT NULL,
	"lastLoginDetected" timestamp,
	"loginSource" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "lastActivityAt" timestamp;--> statement-breakpoint
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_bankConnectionId_bank_connections_id_fk" FOREIGN KEY ("bankConnectionId") REFERENCES "public"."bank_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_matchedReceiptId_receipts_id_fk" FOREIGN KEY ("matchedReceiptId") REFERENCES "public"."receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_matchedSubscriptionId_subscriptions_id_fk" FOREIGN KEY ("matchedSubscriptionId") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_usage" ADD CONSTRAINT "subscription_usage_subscriptionId_subscriptions_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bank_connections_userId_idx" ON "bank_connections" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "bank_transactions_userId_idx" ON "bank_transactions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "bank_transactions_bankConnectionId_idx" ON "bank_transactions" USING btree ("bankConnectionId");--> statement-breakpoint
CREATE INDEX "subscription_usage_subscriptionId_idx" ON "subscription_usage" USING btree ("subscriptionId");