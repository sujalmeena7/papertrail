"use client"

import {
  createDeviceToken,
  revokeDeviceToken,
} from "@/app/actions/device-tokens"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Check, Copy, KeyRound, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

type TokenRow = {
  id: string
  label: string
  tokenPrefix: string
  lastUsedAt: Date | null
  createdAt: Date
}

export function DeviceTokensCard({ tokens }: { tokens: TokenRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newToken, setNewToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreate = () => {
    startTransition(async () => {
      try {
        const token = await createDeviceToken("Capture device")
        setNewToken(token)
        setCopied(false)
        router.refresh()
      } catch {
        toast.error("Failed to create token")
      }
    })
  }

  const handleRevoke = (id: string) => {
    startTransition(async () => {
      try {
        await revokeDeviceToken(id)
        toast.success("Token revoked")
        router.refresh()
      } catch {
        toast.error("Failed to revoke token")
      }
    })
  }

  const handleCopy = async () => {
    if (!newToken) return
    await navigator.clipboard.writeText(newToken)
    setCopied(true)
    toast.success("Token copied to clipboard")
  }

  return (
    <Card className="premium-card premium-glow">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <KeyRound
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <CardTitle className="text-base">Capture tokens</CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCreate}
            disabled={isPending}
          >
            <Plus className="size-4" aria-hidden="true" />
            New token
          </Button>
        </div>
        <CardDescription className="leading-relaxed">
          Pair the upcoming Chrome extension (or any script) with your account.
          Send receipts to POST /api/capture with the token as a Bearer
          authorization header.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {newToken && (
          <div className="flex flex-col gap-2 rounded-md border border-border bg-muted p-3">
            <p className="text-xs font-medium">
              Copy this token now — it won&apos;t be shown in full again.
            </p>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={newToken}
                className="font-mono text-xs"
                aria-label="New capture token"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                aria-label="Copy token"
              >
                {copied ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  <Copy className="size-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        )}

        {tokens.length === 0 && !newToken ? (
          <p className="text-sm text-muted-foreground">
            No capture tokens yet.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {tokens.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2 py-2.5"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{t.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {t.tokenPrefix}…
                    {t.lastUsedAt
                      ? ` · last used ${new Date(t.lastUsedAt).toLocaleDateString("en-US")}`
                      : " · never used"}
                  </span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRevoke(t.id)}
                  disabled={isPending}
                  aria-label={`Revoke token ${t.label}`}
                >
                  <Trash2
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
