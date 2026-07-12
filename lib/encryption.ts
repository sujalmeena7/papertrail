import { randomBytes, createCipheriv, createDecipheriv } from "crypto"

// Requires a 32-byte (256-bit) hex key. No fallback: a missing/weak key here
// would silently downgrade encryption of OAuth tokens and bank access tokens
// to a value baked into source control.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
if (!ENCRYPTION_KEY || !/^[0-9a-fA-F]{64}$/.test(ENCRYPTION_KEY)) {
  throw new Error(
    "ENCRYPTION_KEY must be set to a 64-character hex string (32 bytes). Generate one with `openssl rand -hex 32`.",
  )
}
const keyBuffer = Buffer.from(ENCRYPTION_KEY, "hex")

export function encrypt(text: string): string {
  if (!text) return text
  const iv = randomBytes(12) // GCM standard IV size is 12 bytes (96 bits)
  const cipher = createCipheriv("aes-256-gcm", keyBuffer, iv)

  let encrypted = cipher.update(text, "utf8", "base64")
  encrypted += cipher.final("base64")
  const authTag = cipher.getAuthTag().toString("base64")

  return `${iv.toString("base64")}:${encrypted}:${authTag}`
}

export function decrypt(encryptedText: string): string | null {
  if (!encryptedText) return null
  if (!encryptedText.includes(":")) return encryptedText // Fallback for legacy plaintext if any

  const [iv64, encrypted64, authTag64] = encryptedText.split(":")
  if (!iv64 || !encrypted64 || !authTag64) return null

  try {
    const iv = Buffer.from(iv64, "base64")
    const authTag = Buffer.from(authTag64, "base64")
    const decipher = createDecipheriv("aes-256-gcm", keyBuffer, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted64, "base64", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
  } catch (error) {
    console.error("Decryption failed:", error)
    return null
  }
}
