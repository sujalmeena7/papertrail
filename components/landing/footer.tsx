'use client'

import { motion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const
const CONTACT = 'meenasujal60@gmail.com'

type FooterLink = { label: string; href: string; external?: boolean }

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Sources', href: '/#sources' },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Security', href: '/security' },
      { label: 'Contact', href: `mailto:${CONTACT}`, external: true },
    ],
  },
]

// The footer is a fixed dark panel in BOTH light and dark themes, so it uses
// hard-coded zinc/indigo values rather than the theme tokens (bg-foreground /
// text-background would invert to white in dark mode). Same approach as the
// auth page's branding panel.
export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-zinc-950 text-zinc-100">
      {/* top hairline + soft glow accents */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-10%] h-96 w-96 rounded-full bg-indigo-500/20 blur-[150px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-[-10%] h-80 w-80 rounded-full bg-primary/10 blur-[130px]"
      />

      <div className="relative mx-auto max-w-7xl px-5 pt-16 md:px-8 md:pt-24">
        {/* Final CTA */}
        <div className="flex flex-col items-start gap-8 border-b border-white/10 pb-16 md:flex-row md:items-end md:justify-between md:pb-20">
          <motion.h2
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: EASE }}
            className="max-w-2xl text-3xl leading-tight font-bold tracking-tight text-balance md:text-6xl"
          >
            Stop chasing receipts.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Start closing your books.
            </span>
          </motion.h2>
          <a
            href="/#pricing"
            className="group flex shrink-0 items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-bold tracking-wide text-white uppercase shadow-[0_12px_32px_-12px_oklch(0.62_0.17_258/70%)] transition-all hover:brightness-110"
          >
            Install Papertrail
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </a>
        </div>

        {/* Brand + link columns */}
        <div className="grid gap-12 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:py-16">
          <div className="max-w-sm">
            <p className="flex items-center gap-2 text-sm font-bold tracking-tight uppercase">
              <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-white">
                <span className="h-1.5 w-1.5 rounded-[2px] bg-primary" aria-hidden="true" />
              </span>
              Papertrail&reg;
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              Every receipt. Found. Filed. Forgotten. Built for freelancers, agencies, and the
              accountants who love them.
            </p>
            <a
              href={`mailto:${CONTACT}`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-zinc-300 transition-colors hover:text-primary"
            >
              <span className="h-px w-6 bg-current" aria-hidden="true" />
              {CONTACT}
            </a>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                {col.title}
              </h3>
              <ul className="mt-5 flex flex-col gap-3.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(link.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="group inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                      <span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-4" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-6 font-mono text-[10px] tracking-widest text-zinc-500 uppercase sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; 2026 Papertrail Inc.</span>
          <span className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-primary" aria-hidden="true" />
            Bank-grade encryption &middot; Made for tax season
          </span>
        </div>

        {/* Giant outline wordmark */}
        <div aria-hidden="true" className="pointer-events-none select-none">
          <motion.p
            initial={{ y: 80, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 1, ease: EASE }}
            className="translate-y-[0.18em] text-center text-[15.5vw] leading-none font-bold tracking-[-0.04em] whitespace-nowrap uppercase"
            style={{ WebkitTextStroke: '1px rgba(255,255,255,0.08)', color: 'transparent' }}
          >
            Papertrail
          </motion.p>
        </div>
      </div>
    </footer>
  )
}
