'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'

const ease = [0.22, 1, 0.36, 1] as const

/* --------------------------------- Counter --------------------------------- */

function AnimatedCounter({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { stiffness: 45, damping: 22 })
  const formatted = useTransform(spring, (v) => Math.round(v).toLocaleString('en-US'))
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (inView) motionValue.set(target)
  }, [inView, motionValue, target])

  useEffect(() => {
    const unsub = formatted.on('change', (v) => setDisplay(v))
    return unsub
  }, [formatted])

  return <span ref={ref}>{display}</span>
}

/* ----------------------------- Live activity feed ---------------------------- */

const activityFeed = [
  'Scanning inbox — 3 new emails',
  'Found AWS invoice — $1,284.09',
  'Filed to 2026 / Q3 / Cloud',
  'Found OpenAI invoice — $240.00',
  'Renamed openai_jul_01.pdf',
  'Pulled Vercel PDF — $60.00',
  'Folder synced with accountant',
]

function LiveActivityBadge() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % activityFeed.length)
    }, 2600)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease }}
      className="mb-7 inline-flex h-9 items-center gap-2.5 overflow-hidden rounded-full border border-border bg-card/60 py-1.5 pr-4 pl-3 backdrop-blur-xl"
    >
      <span className="relative flex size-1.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
        <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
      </span>
      <span className="relative block h-4 w-56 overflow-hidden sm:w-64">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={index}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.45, ease }}
            className="absolute inset-0 truncate font-mono text-[11px] leading-4 tracking-wide text-muted-foreground"
          >
            {activityFeed[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.div>
  )
}

/* ------------------------------ Filing theater ------------------------------ */

type ReceiptSpec = {
  id: string
  vendor: string
  amount: string
  date: string
  glyph: string
  className: string
  /* translate delta from resting slot to the folder mouth */
  fly: { x: number; y: number }
  cycleDelay: number
}

const CYCLE = 10.5 // seconds for a full 3-receipt rotation

const receipts: ReceiptSpec[] = [
  {
    id: 'aws',
    vendor: 'Amazon Web Services',
    amount: '$1,284.09',
    date: 'Jun 30',
    glyph: 'AW',
    className: 'right-[8%] top-[2%] w-64 lg:w-72',
    fly: { x: 26, y: 372 },
    cycleDelay: 0,
  },
  {
    id: 'openai',
    vendor: 'OpenAI',
    amount: '$240.00',
    date: 'Jul 01',
    glyph: 'OA',
    className: 'right-[0%] top-[30%] w-64 lg:w-72',
    fly: { x: -14, y: 252 },
    cycleDelay: CYCLE / 3,
  },
  {
    id: 'vercel',
    vendor: 'Vercel',
    amount: '$60.00',
    date: 'Jul 03',
    glyph: '▲',
    className: 'right-[14%] top-[58%] w-64 lg:w-72',
    fly: { x: 44, y: 132 },
    cycleDelay: (CYCLE / 3) * 2,
  },
]

function TheaterReceipt({ spec }: { spec: ReceiptSpec }) {
  return (
    <motion.div
      className={`absolute ${spec.className}`}
      initial={{ opacity: 0, y: -44, x: 0, scale: 0.94, rotate: -3 }}
      animate={{
        opacity: [0, 1, 1, 1, 0.9, 0, 0],
        y: [-44, 0, 0, 0, spec.fly.y, spec.fly.y, -44],
        x: [0, 0, 0, 0, spec.fly.x, spec.fly.x, 0],
        scale: [0.94, 1, 1, 1.02, 0.42, 0.4, 0.94],
        rotate: [-3, -1.5, -1.5, 0, 4, 4, -3],
      }}
      transition={{
        duration: CYCLE,
        times: [0, 0.06, 0.52, 0.6, 0.72, 0.73, 1],
        ease: 'easeInOut',
        repeat: Number.POSITIVE_INFINITY,
        delay: spec.cycleDelay,
      }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card/80 p-4 shadow-[0_24px_60px_-16px_oklch(0_0_0/55%)] backdrop-blur-xl">
        {/* Scan sweep — a bar of light passes over the receipt before it files */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 h-16"
          style={{
            background:
              'linear-gradient(to bottom, transparent, oklch(0.62 0.17 258 / 22%), oklch(0.85 0.08 258 / 30%), oklch(0.62 0.17 258 / 22%), transparent)',
          }}
          initial={{ top: '-30%', opacity: 0 }}
          animate={{
            top: ['-30%', '-30%', '-30%', '110%', '110%', '110%'],
            opacity: [0, 0, 1, 1, 0, 0],
          }}
          transition={{
            duration: CYCLE,
            times: [0, 0.3, 0.34, 0.5, 0.52, 1],
            ease: 'linear',
            repeat: Number.POSITIVE_INFINITY,
            delay: spec.cycleDelay,
          }}
        />
        {/* Border glow while scanning */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-primary/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1, 1, 0, 0] }}
          transition={{
            duration: CYCLE,
            times: [0, 0.32, 0.4, 0.55, 0.62, 1],
            repeat: Number.POSITIVE_INFINITY,
            delay: spec.cycleDelay,
          }}
        />

        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-secondary text-[11px] font-semibold text-foreground">
            {spec.glyph}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{spec.vendor}</p>
            <p className="text-xs text-muted-foreground">
              Invoice PDF &middot; {spec.date}
            </p>
          </div>
          <p className="font-mono text-sm font-medium">{spec.amount}</p>
        </div>

        <div className="mt-3.5 flex items-center justify-between border-t border-border pt-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="size-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h3l1.5 1.5h4.5A1.5 1.5 0 0 1 14 7v4.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5z" />
            </svg>
            2026 / Q3 / Cloud
          </span>
          {/* Status flips from Detected -> Filed right after the scan */}
          <span className="relative h-[22px] w-[74px]">
            <motion.span
              initial={{ opacity: 1 }}
              animate={{ opacity: [1, 1, 0, 0, 1] }}
              transition={{
                duration: CYCLE,
                times: [0, 0.5, 0.56, 0.99, 1],
                repeat: Number.POSITIVE_INFINITY,
                delay: spec.cycleDelay,
              }}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-secondary text-[11px] font-medium text-muted-foreground"
            >
              Detected
            </motion.span>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.8, 0.8, 1, 1, 0.8] }}
              transition={{
                duration: CYCLE,
                times: [0, 0.5, 0.56, 0.99, 1],
                repeat: Number.POSITIVE_INFINITY,
                delay: spec.cycleDelay,
              }}
              className="absolute inset-0 flex items-center justify-center gap-1 rounded-full bg-primary/15 text-[11px] font-medium text-primary"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="size-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8.5 6.5 12 13 4.5" />
              </svg>
              Filed
            </motion.span>
          </span>
        </div>
      </div>
    </motion.div>
  )
}

function FilingTheater() {
  const [fileCount, setFileCount] = useState(1284)

  useEffect(() => {
    /* one receipt lands in the folder every third of a cycle */
    const first = setTimeout(
      () => {
        setFileCount((c) => c + 1)
        const id = setInterval(() => {
          setFileCount((c) => c + 1)
        }, (CYCLE / 3) * 1000)
        cleanupRef.current = () => clearInterval(id)
      },
      CYCLE * 0.73 * 1000,
    )
    const cleanupRef = { current: () => {} }
    return () => {
      clearTimeout(first)
      cleanupRef.current()
    }
  }, [])

  return (
    <div className="relative hidden h-[460px] lg:block" aria-hidden="true">
      {receipts.map((spec) => (
        <TheaterReceipt key={spec.id} spec={spec} />
      ))}

      {/* Destination folder — pulses each time a receipt lands */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.6, ease }}
        className="absolute right-[4%] bottom-[-4%] w-60"
      >
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1, 1.04, 1, 1] }}
          transition={{
            duration: CYCLE / 3,
            times: [0, 0.6, 0.68, 0.78, 1],
            repeat: Number.POSITIVE_INFINITY,
            delay: CYCLE * 0.66,
          }}
          className="relative flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-3.5 backdrop-blur-xl"
        >
          {/* Landing glow */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl bg-primary/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 1, 0, 0] }}
            transition={{
              duration: CYCLE / 3,
              times: [0, 0.6, 0.68, 0.82, 1],
              repeat: Number.POSITIVE_INFINITY,
              delay: CYCLE * 0.66,
            }}
          />
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h3l1.5 1.5h4.5A1.5 1.5 0 0 1 14 7v4.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium">2026 &mdash; Receipts</p>
            <p className="font-mono text-xs text-muted-foreground tabular-nums">
              {fileCount.toLocaleString('en-US')} files &middot; shared
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

/* ----------------------------------- Hero ----------------------------------- */

const headlineLines = [
  { words: ['Every', 'receipt,'], muted: false },
  { words: ['found', 'and', 'filed.'], muted: false },
]

const stats = [
  { value: 14208, suffix: '', label: 'Receipts recovered this week' },
  { value: 40, suffix: '+', label: 'Billing portals monitored' },
  { value: 0, suffix: '', label: 'Clicks needed from you' },
]

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const rawX = useMotionValue(-400)
  const rawY = useMotionValue(-400)
  const spotX = useSpring(rawX, { stiffness: 60, damping: 22 })
  const spotY = useSpring(rawY, { stiffness: 60, damping: 22 })
  const spotlightMask = useMotionTemplate`radial-gradient(340px circle at ${spotX}px ${spotY}px, black 0%, transparent 100%)`

  function handleMouseMove(e: React.MouseEvent) {
    const rect = sectionRef.current?.getBoundingClientRect()
    if (!rect) return
    rawX.set(e.clientX - rect.left)
    rawY.set(e.clientY - rect.top)
  }

  let wordIndex = 0

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-svh overflow-hidden"
    >
      {/* Atmosphere */}
      <div aria-hidden="true" className="bg-hero-aurora absolute inset-0" />
      <div aria-hidden="true" className="bg-hero-grid absolute inset-0" />
      <div aria-hidden="true" className="bg-hero-spotlight absolute inset-0" />
      {/* Cursor spotlight — brighter grid follows the mouse */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          maskImage: spotlightMask,
          WebkitMaskImage: spotlightMask,
          backgroundImage:
            'linear-gradient(to right, oklch(0.62 0.17 258 / 14%) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.62 0.17 258 / 14%) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-5 pt-24 pb-16 md:px-8 md:pt-28 lg:grid-cols-[1.15fr_1fr] lg:gap-8 lg:pb-24">
        {/* Left: copy */}
        <div>
          <LiveActivityBadge />

          <h1 className="text-[2.75rem] leading-[1.04] font-semibold tracking-[-0.03em] text-balance sm:text-6xl lg:text-[4.25rem]">
            {headlineLines.map((line) => (
              <span key={line.words.join(' ')} className="block overflow-hidden pb-[0.08em]">
                <span className="block">
                  {line.words.map((word) => {
                    const delay = 0.2 + wordIndex * 0.07
                    wordIndex += 1
                    return (
                      <motion.span
                        key={word}
                        className="mr-[0.24em] inline-block last:mr-0"
                        initial={{ y: '110%' }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.9, delay, ease }}
                      >
                        {word}
                      </motion.span>
                    )
                  })}
                </span>
              </span>
            ))}
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span
                className="text-shimmer inline-block"
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, delay: 0.2 + wordIndex * 0.07, ease }}
              >
                Automatically.
              </motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75, ease }}
            className="mt-6 max-w-md text-base leading-relaxed text-pretty text-muted-foreground md:text-lg"
          >
            Papertrail quietly detects invoices in Gmail and pulls PDFs from AWS, OpenAI, Stripe,
            Vercel and 40+ other portals. Your accountant gets one tidy folder.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <a
              href="/dashboard"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_0_1px_oklch(1_0_0/12%)_inset,0_12px_32px_-12px_oklch(0.62_0.17_258/60%)] transition-all hover:brightness-110"
            >
              Start filing free
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="size-3.5 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card/40 px-6 py-3 text-sm font-medium text-foreground backdrop-blur-xl transition-colors hover:bg-secondary"
            >
              See how it works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.15 }}
            className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground"
          >
            <span>Works with</span>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono tracking-wide">
              <span>Gmail</span>
              <span aria-hidden="true" className="text-border">
                &middot;
              </span>
              <span>AWS</span>
              <span aria-hidden="true" className="text-border">
                &middot;
              </span>
              <span>OpenAI</span>
              <span aria-hidden="true" className="text-border">
                &middot;
              </span>
              <span>Stripe</span>
              <span aria-hidden="true" className="text-border">
                &middot;
              </span>
              <span>Vercel</span>
            </span>
          </motion.div>
        </div>

        {/* Right: live filing theater */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.7 }}
        >
          <FilingTheater />
        </motion.div>
      </div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 1.3, ease }}
        className="relative mx-auto max-w-6xl px-5 pb-16 md:px-8 md:pb-20"
      >
        <dl className="grid grid-cols-1 gap-8 border-t border-border pt-8 sm:grid-cols-3 md:pt-10">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dd className="text-3xl font-semibold tracking-tight md:text-4xl">
                <AnimatedCounter target={stat.value} />
                {stat.suffix}
              </dd>
              <dt className="mt-1.5 text-sm text-muted-foreground">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </motion.div>
    </section>
  )
}
