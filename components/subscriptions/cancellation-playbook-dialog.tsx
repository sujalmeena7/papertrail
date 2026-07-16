"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LockedOverlay } from "@/components/locked-overlay"
import type { Subscription } from "@/lib/db/schema"
import type { Plan } from "@/lib/billing/plan"
import {
  getPlaybook,
  type CancellationDifficulty,
} from "@/lib/subscriptions/cancellation-playbooks"
import { getCancelUrl } from "@/lib/subscriptions/vendors"
import { cancelSubscription } from "@/app/actions/subscriptions"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Phone,
  ShieldQuestion,
} from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const EASE = [0.22, 1, 0.36, 1] as const

const DIFFICULTY_META: Record<
  CancellationDifficulty,
  { label: string; className: string; blurb: string }
> = {
  easy: {
    label: "Easy",
    className: "bg-emerald-500/15 text-emerald-500 border-0",
    blurb: "A couple of clicks — no runaround.",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-500/15 text-amber-500 border-0",
    blurb: "Self-serve, but the option is buried or they'll try to keep you.",
  },
  hard: {
    label: "Hard",
    className: "bg-destructive/15 text-destructive border-0",
    blurb: "Expect friction — hidden flows, fees, or a phone call.",
  },
}

function monthlyEquivalent(sub: Subscription): number {
  if (sub.cadence === "annual") return sub.currentAmountCents / 12
  if (sub.cadence === "quarterly") return sub.currentAmountCents / 3
  return sub.currentAmountCents
}

function formatAmount(cents: number, currency: string): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency || "USD",
  })
}

export function CancellationPlaybookDialog({
  subscription,
  plan,
  open,
  onOpenChange,
  onCancelled,
}: {
  subscription: Subscription | null
  plan: Plan
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after the sub is successfully marked cancelled, so the table can drop it. */
  onCancelled?: (id: string) => void
}) {
  const [isPending, startTransition] = useTransition()

  if (!subscription) return null

  const isPro = plan === "pro"
  const playbook = getPlaybook(subscription.vendorNormalized)
  const cancelUrl = getCancelUrl(subscription.vendorNormalized)
  const diff = DIFFICULTY_META[playbook.difficulty]
  const monthlySaving = monthlyEquivalent(subscription)

  const handleConfirmCancelled = () => {
    startTransition(async () => {
      try {
        await cancelSubscription(subscription.id)
        onCancelled?.(subscription.id)
        onOpenChange(false)
        toast.success(
          `Nice — ${subscription.vendorNormalized} cancelled`,
          {
            description: `You just freed up ${formatAmount(
              monthlySaving,
              subscription.currency
            )}/mo (${formatAmount(monthlySaving * 12, subscription.currency)}/yr).`,
          }
        )
      } catch {
        toast.error("Couldn't update the subscription. Please try again.")
      }
    })
  }

  // The actionable core (direct link + numbered steps + confirm button).
  // Pro users see it live; free users see it blurred behind an upgrade CTA.
  const actionableCore = (
    <div className="flex flex-col gap-5">
      {/* Direct cancel link */}
      {cancelUrl ? (
        <a
          href={cancelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          <ExternalLink className="size-4" />
          Open {subscription.vendorNormalized} cancellation page
        </a>
      ) : (
        <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <ShieldQuestion className="mt-0.5 size-4 shrink-0" />
          <span>
            We don't have a direct cancel link for this vendor yet — follow the
            steps below from their website.
          </span>
        </div>
      )}

      {/* Numbered steps */}
      <motion.ol
        className="flex flex-col gap-3"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      >
        {playbook.steps.map((step, i) => (
          <motion.li
            key={i}
            className="flex items-start gap-3"
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed pt-0.5">{step}</span>
          </motion.li>
        ))}
      </motion.ol>

      {/* Confirm cancelled */}
      <Button
        variant="outline"
        className="w-full border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-emerald-500"
        onClick={handleConfirmCancelled}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CheckCircle2 className="size-4" />
        )}
        I've cancelled it
      </Button>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="capitalize">
              Cancel {subscription.vendorNormalized}
            </DialogTitle>
            <Badge className={cn("text-[10px] h-5 px-1.5", diff.className)}>
              {diff.label}
            </Badge>
          </div>
          <DialogDescription className="flex items-center gap-3 pt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />~{playbook.estimatedMinutes} min
            </span>
            {playbook.requiresContact && (
              <span className="flex items-center gap-1 text-amber-500">
                <Phone className="size-3.5" />
                Contact required
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-1">
          {/* Difficulty blurb — always visible (the teaser) */}
          <p className="text-sm text-muted-foreground">{diff.blurb}</p>

          {/* Retention-trap warning — always visible (the hook) */}
          {playbook.retentionWarning && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-500">
                  Retention trap
                </span>
                <span className="text-sm leading-relaxed">
                  {playbook.retentionWarning}
                </span>
              </div>
            </div>
          )}

          {/* Actionable core — Pro live, free blurred */}
          {isPro ? (
            actionableCore
          ) : (
            <LockedOverlay
              title="Unlock the full cancellation guide"
              description="Get the direct cancel link and step-by-step instructions for every subscription."
            >
              {actionableCore}
            </LockedOverlay>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
