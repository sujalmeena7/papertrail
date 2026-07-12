"use client"

import { useEffect, useState, useTransition } from "react"
import { usePathname } from "next/navigation"

export function NavigationProgress() {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // When the pathname changes, the navigation is done
    setIsNavigating(false)
    setProgress(100)
    const timeout = setTimeout(() => setProgress(0), 300)
    return () => clearTimeout(timeout)
  }, [pathname])

  // Listen to link clicks to detect navigation start
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a")
      if (!target) return
      const href = target.getAttribute("href")
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto")) return
      if (href === pathname) return
      
      setIsNavigating(true)
      setProgress(20)

      // Animate progress
      const t1 = setTimeout(() => setProgress(50), 200)
      const t2 = setTimeout(() => setProgress(70), 600)
      const t3 = setTimeout(() => setProgress(85), 1500)
      
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
      }
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [pathname])

  if (progress === 0) return null

  return (
    <div
      className="fixed inset-x-0 top-0 z-[100] h-[2px] bg-primary/80 transition-all duration-300 ease-out"
      style={{
        width: `${progress}%`,
        opacity: progress === 100 ? 0 : 1,
        transition: progress === 100 
          ? "width 200ms ease-out, opacity 300ms ease-out 100ms" 
          : "width 300ms ease-out",
      }}
    />
  )
}
