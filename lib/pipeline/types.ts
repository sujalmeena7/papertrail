// Core types for the email → receipt detection pipeline.

export interface EmailMessage {
  /** Stable unique id (gmail message id or fixture id) — used as idempotency key */
  id: string
  from: string
  subject: string
  date: string // ISO date
  /** Plain-text body (or stripped HTML) */
  body: string
  /** Names of attachments, if any (e.g. ["invoice-123.pdf"]) */
  attachments?: string[]
}

/**
 * Abstraction over where emails come from. Cycle 1 ships a fixture source;
 * the Gmail source activates when Google OAuth credentials are provided.
 */
export interface EmailSource {
  name: "fixture" | "gmail"
  /** Fetch candidate emails (bounded by the source implementation). */
  fetchEmails(options?: { after?: Date; max?: number }): Promise<EmailMessage[]>
}

export type ReceiptCategory =
  | "cloud"
  | "saas"
  | "ai"
  | "domains"
  | "payments"
  | "design"
  | "productivity"
  | "marketing"
  | "other"

export interface ExtractedReceipt {
  isReceipt: true
  vendor: string
  amountCents: number
  currency: string
  /** ISO date (YYYY-MM-DD) */
  date: string
  invoiceNumber: string | null
  category: ReceiptCategory
  /** 0-1 model confidence that this is a real business receipt */
  confidence: number
}

export interface NotAReceipt {
  isReceipt: false
  reason: string
}

export type ClassificationResult = ExtractedReceipt | NotAReceipt

export interface ScanStats {
  emailsScanned: number
  emailsMatched: number
  receiptsCreated: number
  receiptsSkipped: number
}
