import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Legal — Papertrail",
  robots: { index: true, follow: true },
}

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight transition-colors hover:text-primary"
          >
            <span className="flex size-5 items-center justify-center rounded-[5px] bg-foreground">
              <span
                className="size-1.5 rounded-[2px] bg-primary"
                aria-hidden="true"
              />
            </span>
            Papertrail
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-14 md:py-20">{children}</main>

      {/* Minimal footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Papertrail Inc.</span>
          <nav className="flex gap-4">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="/security" className="transition-colors hover:text-foreground">
              Security
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
