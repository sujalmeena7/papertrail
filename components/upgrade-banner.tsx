"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UpgradeDialog } from "@/components/upgrade-dialog"

const DISMISS_KEY = "papertrail:upgrade-banner-dismissed"

export function UpgradeBanner({ alertCount = 0 }: { alertCount?: number }) {
  // Start hidden (null = "haven't checked yet") so server and first client
  // render match; reveal only after we've read sessionStorage on mount.
  const [dismissed, setDismissed] = useState<boolean | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1")
  }, [])

  const headline =
    alertCount > 0
      ? `${alertCount} subscription${alertCount === 1 ? "" : "s"} need your attention`
      : "You're only seeing part of the picture"

  const body =
    alertCount > 0
      ? "Pro unlocks one-click cancellation links and renewal alerts, so price hikes and sneaky charges never catch you off guard again."
      : "Upgrade to Pro to unlock every money leak, one-click cancellations, and the full weekly digest — not just a teaser."

  return (
    <>
      <AnimatePresence initial={false}>
        {dismissed === false && (
          <motion.div
            key="upgrade-banner"
            layout
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="premium-card premium-glow relative flex flex-col items-start gap-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.06] via-transparent to-accent/[0.06] p-5 sm:flex-row sm:items-center">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-foreground shadow-lg shadow-primary/20">
                <Sparkles className="size-5 text-primary-foreground" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{headline}</p>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
              <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
                <Button
                  size="sm"
                  onClick={() => setOpen(true)}
                  className="flex-1 bg-gradient-to-r from-primary to-accent-foreground shadow-md shadow-primary/20 hover:opacity-90 sm:flex-none"
                >
                  Upgrade to Pro
                  <ArrowRight className="ml-1.5 size-3.5" aria-hidden="true" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Dismiss"
                  onClick={() => {
                    sessionStorage.setItem(DISMISS_KEY, "1")
                    setDismissed(true)
                  }}
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <UpgradeDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
