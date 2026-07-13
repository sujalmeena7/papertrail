"use client"

import { useState, type ReactNode } from "react"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import { cn } from "@/lib/utils"

export function LockedOverlay({
  title,
  description,
  className,
  children,
}: {
  title: string
  description: string
  className?: string
  children?: ReactNode
}) {
  const [open, setOpen] = useState(false)

  const cta = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center px-5 py-8",
        children
          ? "absolute inset-0 bg-background/70 backdrop-blur-sm"
          : "rounded-xl border border-primary/30 bg-primary/5"
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15">
        <Lock className="size-5 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">{description}</p>
      </div>
      <Button size="sm" className="h-8 text-xs" onClick={() => setOpen(true)}>
        Upgrade to Pro
      </Button>
    </div>
  )

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {children && (
        <div aria-hidden="true" className="pointer-events-none select-none blur-sm opacity-50">
          {children}
        </div>
      )}
      {cta}
      <UpgradeDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
