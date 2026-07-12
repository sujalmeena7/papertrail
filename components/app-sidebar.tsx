"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ReceiptText,
  Radar,
  Settings,
  LogOut,
  FileText,
  Moon,
  Sun,
  Monitor,
  User,
  CreditCard,
  ChevronUp,
  Plug,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { useState, useEffect, useRef } from "react"
import { signOut } from "@/lib/auth-client"

interface AppSidebarProps {
  userName: string
  userEmail: string
}

export function AppSidebar({ userName, userEmail }: AppSidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Avoid hydration mismatch for theme toggle
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close panel on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [profileOpen])

  // Close panel on Escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setProfileOpen(false)
    }
    if (profileOpen) {
      document.addEventListener("keydown", handleEscape)
    }
    return () => document.removeEventListener("keydown", handleEscape)
  }, [profileOpen])

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: ReceiptText,
    },
    {
      title: "Subscriptions",
      href: "/dashboard/subscriptions",
      icon: Radar,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : userEmail.substring(0, 2).toUpperCase()

  const profileMenuItems = [
    {
      label: "Account Settings",
      icon: User,
      href: "/dashboard/settings",
    },
    {
      label: "Connections & Devices",
      icon: Plug,
      href: "/dashboard/settings",
    },
    {
      label: "Subscriptions",
      icon: CreditCard,
      href: "/dashboard/subscriptions",
    },
  ]

  const currentTheme = mounted ? theme : "system"

  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 flex flex-col border-r border-border/30 bg-transparent shadow-[1px_0_20px_rgba(0,0,0,0.1)] z-30">
      {/* Brand / Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border/30">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
            <FileText className="size-4 text-primary-foreground" />
          </div>
          <span className="font-bold tracking-tight text-lg">
            papertrail
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 text-[14px] relative group overflow-hidden",
                isActive
                  ? "nav-item-active font-semibold"
                  : "font-medium text-foreground/70 hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              )}
              <item.icon
                className={cn(
                  "size-4 relative z-10 transition-colors",
                  isActive ? "text-primary" : "group-hover:text-primary/70"
                )}
              />
              <span className="relative z-10">{item.title}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="relative p-4 border-t border-border/30" ref={panelRef}>
        {/* ── Profile Popup Panel ── */}
        <div
          className={cn(
            "absolute left-3 right-3 bottom-full mb-2 rounded-xl border border-border/40 bg-popover/95 backdrop-blur-xl shadow-2xl shadow-black/30 transition-all duration-200 origin-bottom overflow-hidden",
            profileOpen
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-95 translate-y-2 pointer-events-none"
          )}
        >
          {/* User Header */}
          <div className="px-4 pt-4 pb-3 border-b border-border/30">
            <p className="text-sm font-semibold truncate">
              {userName || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {userEmail}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1.5">
            {profileMenuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Preferences */}
          <div className="border-t border-border/30 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2.5">
              Preferences
            </p>

            {/* Theme Switcher */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Theme</span>
              {mounted && (
                <div className="flex items-center rounded-lg border border-border/40 bg-muted/30 p-0.5 gap-0.5">
                  <button
                    onClick={() => setTheme("system")}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-md transition-all duration-200",
                      currentTheme === "system"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="System theme"
                  >
                    <Monitor className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-md transition-all duration-200",
                      currentTheme === "light"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Light mode"
                  >
                    <Sun className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-md transition-all duration-200",
                      currentTheme === "dark"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Dark mode"
                  >
                    <Moon className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sign Out */}
          <div className="border-t border-border/30 py-1.5">
            <button
              onClick={() => {
                setProfileOpen(false)
                signOut()
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>

        {/* ── Profile Trigger Button ── */}
        <button
          onClick={() => setProfileOpen((prev) => !prev)}
          className={cn(
            "w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 border group",
            profileOpen
              ? "bg-muted/60 border-border/40"
              : "bg-transparent border-transparent hover:bg-card/40 hover:border-border/30"
          )}
        >
          <Avatar className="size-9 border border-border/50 shadow-sm transition-transform group-hover:scale-105">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0 text-left">
            <span className="text-sm font-medium truncate">
              {userName || "User"}
            </span>
            <span className="text-xs text-muted-foreground truncate opacity-80">
              {userEmail}
            </span>
          </div>
          <ChevronUp
            className={cn(
              "size-4 text-muted-foreground shrink-0 transition-transform duration-200",
              profileOpen ? "rotate-0" : "rotate-180"
            )}
          />
        </button>
      </div>
    </aside>
  )
}
