CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text NOT NULL,
	"label" text DEFAULT 'Chrome extension' NOT NULL,
	"lastUsedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "gmail_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"email" text NOT NULL,
	"encryptedAccessToken" text,
	"encryptedRefreshToken" text,
	"tokenExpiresAt" timestamp,
	"status" text DEFAULT 'disconnected' NOT NULL,
	"lastScanAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"vendor" text NOT NULL,
	"vendorNormalized" text NOT NULL,
	"amountCents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"receiptDate" date NOT NULL,
	"invoiceNumber" text,
	"category" text DEFAULT 'other' NOT NULL,
	"source" text DEFAULT 'gmail' NOT NULL,
	"sourceRef" text,
	"sourceUrl" text,
	"blobUrl" text,
	"blobPathname" text,
	"confidence" real,
	"rawSubject" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scans" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"source" text DEFAULT 'fixture' NOT NULL,
	"emailsScanned" integer DEFAULT 0 NOT NULL,
	"emailsMatched" integer DEFAULT 0 NOT NULL,
	"receiptsCreated" integer DEFAULT 0 NOT NULL,
	"receiptsSkipped" integer DEFAULT 0 NOT NULL,
	"error" text,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subscription_alerts" (
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
--> statement-breakpoint
CREATE TABLE "subscriptions" (
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
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_alerts" ADD CONSTRAINT "subscription_alerts_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_alerts" ADD CONSTRAINT "subscription_alerts_subscriptionId_subscriptions_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "device_tokens_userId_idx" ON "device_tokens" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "gmail_connections_userId_idx" ON "gmail_connections" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "receipts_userId_date_idx" ON "receipts" USING btree ("userId","receiptDate" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "scans_userId_startedAt_idx" ON "scans" USING btree ("userId","startedAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "subscription_alerts_userId_idx" ON "subscription_alerts" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "subscription_alerts_userId_dismissed_idx" ON "subscription_alerts" USING btree ("userId","dismissed");--> statement-breakpoint
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "subscriptions_userId_status_idx" ON "subscriptions" USING btree ("userId","status");