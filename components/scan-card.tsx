"use client"

import {
  enqueueScan,
  pollLatestScan,
  startDemoScan,
} from "@/app/actions/receipts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Scan } from "@/lib/db/schema"
import {
  CheckCircle2,
  Loader2,
  Mail,
  Sparkles,
  XCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { toast } from "sonner"

export function ScanCard({
  scans,
  hasReceipts,
  isGmailConnected,
}: {
  scans: Scan[]
  hasReceipts: boolean
  isGmailConnected: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [queuedScanId, setQueuedScanId] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const lastScan = scans[0]

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const triggerWorker = useCallback((scanId: string) => {
    fetch("/api/scan-worker", { method: "POST" }).catch(() => {
      // Fire-and-forget: the poll will pick up failures
    })
  }, [])

  const startPolling = useCallback(
    (scanId: string) => {
      setQueuedScanId(scanId)
      if (pollRef.current) clearInterval(pollRef.current)

      pollRef.current = setInterval(async () => {
        try {
          const scan = await pollLatestScan()
          if (!scan || scan.id !== scanId) {
            // Not our scan yet or got replaced
            return
          }

          if (scan.status === "completed") {
            clearInterval(pollRef.current!)
            setQueuedScanId(null)
            setLastResult(
              `Scanned ${scan.emailsScanned} emails, found ${scan.receiptsCreated} new receipts` +
                (scan.receiptsSkipped > 0
                  ? ` (${scan.receiptsSkipped} already filed)`
                  : ""),
            )
            setScanSuccess(true)
            toast.success(
              scan.receiptsCreated > 0
                ? `Found ${scan.receiptsCreated} new receipts`
                : "Scan complete — no new receipts",
            )
            router.refresh()
            setTimeout(() => setScanSuccess(false), 3000)
          } else if (scan.status === "failed") {
            clearInterval(pollRef.current!)
            setQueuedScanId(null)
            toast.error(scan.error || "Scan failed. Please try again.")
          }
          // "running" or "pending" — keep polling
        } catch {
          // Polling failed silently, will retry on next interval
        }
      }, 2000)
    },
    [router],
  )

  const handleScan = () => {
    setScanSuccess(false)
    startTransition(async () => {
      try {
        if (isGmailConnected) {
          // Queue-based: enqueue + fire-and-forget worker + poll
          const { scanId } = await enqueueScan()
          triggerWorker(scanId)
          startPolling(scanId)
          toast.info("Scan started in the background…")
        } else {
          // Demo scan is fast — run synchronously for simplicity
          const stats = await startDemoScan()
          const resultMsg =
            `Scanned ${stats.emailsScanned} emails, found ${stats.receiptsCreated} new receipts` +
              (stats.receiptsSkipped > 0
                ? ` (${stats.receiptsSkipped} already filed)`
                : "")
          setLastResult(resultMsg)
          setScanSuccess(true)
          toast.success(
            stats.receiptsCreated > 0
              ? `Found ${stats.receiptsCreated} new receipts`
              : "Scan complete — no new receipts",
          )
          router.refresh()
          setTimeout(() => setScanSuccess(false), 3000)
        }
      } catch {
        toast.error("Scan failed. Please try again.")
      }
    })
  }

  const isScanning = isPending || queuedScanId !== null

  return (
    <Card className="premium-card premium-glow transition-all duration-300 ease-in-out">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md transition-colors duration-300 ${
              isScanning
                ? "bg-amber-500/10 text-amber-600"
                : scanSuccess
                  ? "bg-green-500/10 text-green-600"
                  : "bg-accent text-accent-foreground"
            }`}
          >
            {isScanning ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : scanSuccess ? (
              <CheckCircle2 className="size-4" aria-hidden="true" />
            ) : (
              <Mail className="size-4" aria-hidden="true" />
            )}
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-medium">Inbox scan</h2>
              {isGmailConnected ? (
                <Badge
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 font-mono text-xs transition-colors"
                >
                  connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="font-mono text-xs">
                  demo inbox
                </Badge>
              )}
            </div>
            <p
              className={`text-sm leading-relaxed transition-colors duration-300 ${
                scanSuccess ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {queuedScanId
                ? "Scanning your inbox in the background…"
                : lastResult ??
                  (lastScan
                    ? `Last scan: ${lastScan.emailsScanned} emails, ${lastScan.receiptsCreated} receipts found`
                    : isGmailConnected
                      ? "Your Gmail is connected. Click the button to scan your inbox for receipts."
                      : "Scan a realistic demo inbox to see Papertrail detect and extract receipts with AI. Gmail connection is available in Settings.")}
            </p>
          </div>
        </div>
        <Button
          onClick={handleScan}
          disabled={isScanning}
          className="shrink-0 sm:self-center transition-all duration-200"
        >
          {isScanning ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Scanning inbox…
            </>
          ) : (
            <>
              <Sparkles className="size-4" aria-hidden="true" />
              {isGmailConnected
                ? "Scan Gmail"
                : hasReceipts
                  ? "Re-scan inbox"
                  : "Scan demo inbox"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
