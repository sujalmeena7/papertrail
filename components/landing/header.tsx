'use client'

import { motion } from 'framer-motion'

const navItems = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Sources', href: '#sources' },
  { label: 'Pricing', href: '#pricing' },
]

export function Header() {
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 md:px-8">
        <a href="#" className="flex items-center gap-2 py-4">
          <span className="flex h-6 w-6 items-center justify-center bg-foreground">
            <span className="h-2 w-2 bg-primary" aria-hidden="true" />
          </span>
          <span className="text-sm font-bold tracking-tight uppercase">
            Papertrail<span className="text-primary">&reg;</span>
          </span>
        </a>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-mono text-xs tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <span className="hidden font-mono text-[10px] tracking-widest text-muted-foreground uppercase lg:block">
            Tax season ready
          </span>
          <a
            href="/dashboard"
            className="group flex items-center gap-2 bg-foreground px-4 py-2 text-xs font-semibold tracking-wide text-background uppercase transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Dashboard
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
              &#8599;
            </span>
          </a>
        </div>
      </div>
    </motion.header>
  )
}
