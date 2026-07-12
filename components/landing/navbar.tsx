'use client'

import { motion } from 'framer-motion'

const links = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Sources', href: '#sources' },
  { label: 'Pricing', href: '#pricing' },
]

export function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8 md:py-5">
        {/* Wordmark */}
        <a href="/" className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary">
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="size-3.5 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 2h6l3 3v9H4z" />
              <path d="M10 2v3h3" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Papertrail</span>
        </a>

        {/* Center links in a glass pill */}
        <nav
          aria-label="Primary"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card/60 p-1 backdrop-blur-xl md:flex"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <a
            href="/sign-in"
            className="hidden rounded-full px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Log in
          </a>
          <a
            href="/dashboard"
            className="rounded-full bg-foreground px-4 py-2 text-[13px] font-semibold text-background transition-opacity hover:opacity-85"
          >
            Open dashboard
          </a>
        </div>
      </div>
    </motion.header>
  )
}
