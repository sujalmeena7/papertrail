"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Checkbox({
  className,
  checked,
  onCheckedChange,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "checked" | "onChange"> & {
  checked?: boolean | "indeterminate"
  onCheckedChange?: (checked: boolean) => void
}) {
  const ref = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = checked === "indeterminate"
    }
  }, [checked])

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked === true}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={cn(
        "peer size-4 shrink-0 cursor-pointer rounded border border-input appearance-none",
        "checked:bg-primary checked:border-primary",
        "indeterminate:bg-primary indeterminate:border-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors",
        className,
      )}
      aria-label={props["aria-label"]}
      {...props}
    />
  )
}

export { Checkbox }
