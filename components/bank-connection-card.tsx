"use client"

import { useState, useCallback, useEffect } from "react"
import { usePlaidLink } from "react-plaid-link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Loader2, RefreshCw, Unplug, CheckCircle2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { disconnectBank, syncBankTransactions } from "@/app/actions/bank"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function BankConnectionCard({ connections }: { connections: any[] }) {
  const router = useRouter()
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({})
  const [isDisconnecting, setIsDisconnecting] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function createToken() {
      try {
        const res = await fetch("/api/plaid/create-link-token", { method: "POST" })
        const data = await res.json()
        setLinkToken(data.link_token)
      } catch (err) {
        console.error("Failed to fetch link token")
      }
    }
    createToken()
  }, [])

  const onSuccess = useCallback(async (public_token: string, metadata: any) => {
    try {
      const res = await fetch("/api/plaid/exchange-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_token,
          institution_id: metadata.institution?.institution_id,
          institution_name: metadata.institution?.name,
        }),
      })
      if (!res.ok) throw new Error("Failed to exchange token")
      toast.success("Bank account linked successfully")
      router.refresh()
    } catch (err) {
      toast.error("Failed to link bank account")
    }
  }, [router])

  const { open, ready } = usePlaidLink({
    token: linkToken!,
    onSuccess,
  })

  const handleSync = async (id: string) => {
    setIsSyncing(prev => ({ ...prev, [id]: true }))
    try {
      const result = await syncBankTransactions(id)
      toast.success(`Synced ${result.count} transactions`)
    } catch (err) {
      toast.error("Failed to sync transactions")
    } finally {
      setIsSyncing(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleDisconnect = async (id: string) => {
    setIsDisconnecting(prev => ({ ...prev, [id]: true }))
    try {
      await disconnectBank(id)
      toast.success("Bank account disconnected")
    } catch (err) {
      toast.error("Failed to disconnect bank account")
    } finally {
      setIsDisconnecting(prev => ({ ...prev, [id]: false }))
    }
  }

  return (
    <Card className="premium-card premium-glow">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-base">Bank Connections</CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => open()}
            disabled={!ready || !linkToken}
          >
            Connect Bank
          </Button>
        </div>
        <CardDescription className="leading-relaxed">
          Link your bank account to automatically find stealth subscriptions that don't send email receipts.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {connections.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bank accounts connected.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {connections.map((conn) => (
              <li key={conn.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="size-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm flex items-center gap-2">
                      {conn.institutionName} 
                      {conn.status === "connected" ? (
                        <Badge variant="default" className="bg-green-600/20 text-green-500 hover:bg-green-600/30 border-0 h-5 px-1.5 text-[10px]">Connected</Badge>
                      ) : (
                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Error</Badge>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {conn.accountName} •••• {conn.accountMask}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span className="text-xs text-muted-foreground mr-2 hidden sm:block">
                    {conn.lastSyncAt ? `Synced ${new Date(conn.lastSyncAt).toLocaleDateString("en-US")}` : 'Never synced'}
                  </span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleSync(conn.id)}
                    disabled={isSyncing[conn.id]}
                  >
                    {isSyncing[conn.id] ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                    <span className="sr-only">Sync</span>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDisconnect(conn.id)}
                    disabled={isDisconnecting[conn.id]}
                  >
                    {isDisconnecting[conn.id] ? <Loader2 className="size-4 animate-spin" /> : <Unplug className="size-4" />}
                    <span className="sr-only">Disconnect</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
