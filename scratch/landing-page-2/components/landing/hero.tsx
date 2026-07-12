'use client'

import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'

const ease = [0.22, 1, 0.36, 1] as const

/* ---------------------------------- Counter ---------------------------------- */

function AnimatedCounter({ target, className }: { target: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { stiffness: 40, damping: 20 })
  const formatted = useTransform(spring, (v) => Math.round(v).toLocaleString('en-US'))
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (inView) motionValue.set(target)
  }, [inView, motionValue, target])

  useEffect(() => {
    const unsub = formatted.on('change', (v) => setDisplay(v))
    return unsub
  }, [formatted])

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}

/* ------------------------------ Floating receipt ----------------------------- */

type ReceiptSpec = {
  id: string
  vendor: string
  amount: string
  date: string
  className: string
  depth: number
  rotate: number
  delay: number
  stamped?: boolean
}

const receipts: ReceiptSpec[] = [
  {
    id: 'aws',
    vendor: 'AWS',
    amount: '$1,284.09',
    date: 'JUN 30',
    className: 'right-[4%] top-[6%] w-40 lg:w-48',
    depth: 26,
    rotate: 5,
    delay: 1.15,
    stamped: true,
  },
  {
    id: 'openai',
    vendor: 'OPENAI',
    amount: '$240.00',
    date: 'JUL 01',
    className: 'right-[11%] top-[36%] w-36 lg:w-44',
    depth: 42,
    rotate: -6,
    delay: 1.3,
    stamped: true,
  },
  {
    id: 'vercel',
    vendor: 'VERCEL',
    amount: '$60.00',
    date: 'JUL 03',
    className: 'right-[2%] top-[58%] w-32 lg:w-40',
    depth: 60,
    rotate: 8,
    delay: 1.45,
  },
]

function FloatingReceipt({
  spec,
  mx,
  my,
}: {
  spec: ReceiptSpec
  mx: MotionValue<number>
  my: MotionValue<number>
}) {
  const x = useTransform(mx, (v) => v * spec.depth)
  const y = useTransform(my, (v) => v * spec.depth)

  return (
    <motion.div
      className={`absolute ${spec.className}`}
      style={{ x, y }}
      initial={{ opacity: 0, y: 60, rotate: spec.rotate * 2.4, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, rotate: spec.rotate, scale: 1 }}
      transition={{ duration: 1, delay: spec.delay, ease }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 5.5 + spec.depth / 20,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
          delay: spec.delay,
        }}
        className="paper-shadow relative bg-[oklch(0.985_0.003_91)] p-3 lg:p-4"
      >
        {/* perforated top edge */}
        <div
          aria-hidden="true"
          className="absolute -top-px left-0 h-[3px] w-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at 4px 0, transparent 3px, oklch(0.955 0.004 91) 3px)',
            backgroundSize: '8px 3px',
          }}
        />
        <div className="flex items-baseline justify-between font-mono text-[9px] tracking-widest text-muted-foreground uppercase lg:text-[10px]">
          <span className="font-bold text-foreground">{spec.vendor}</span>
          <span>{spec.date}</span>
        </div>
        <div className="mt-2 space-y-1.5" aria-hidden="true">
          <div className="h-1 w-full bg-foreground/10" />
          <div className="h-1 w-3/4 bg-foreground/10" />
          <div className="h-1 w-5/6 bg-foreground/10" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-[8px] tracking-widest text-muted-foreground uppercase">
            Invoice PDF
          </span>
          <span className="font-mono text-xs font-bold lg:text-sm">{spec.amount}</span>
        </div>
        {spec.stamped && (
          <motion.span
            initial={{ opacity: 0, scale: 2.2, rotate: -18 }}
            animate={{ opacity: 1, scale: 1, rotate: -12 }}
            transition={{ duration: 0.35, delay: spec.delay + 1.1, ease: 'easeOut' }}
            className="absolute -top-2 -right-3 border-2 border-primary px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest text-primary uppercase"
          >
            Filed
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  )
}

/* ----------------------------------- Hero ------------------------------------ */

const line1 = ['Every', 'receipt.']
const line2 = ['Found.', 'Filed.']

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const mx = useSpring(rawX, { stiffness: 50, damping: 18 })
  const my = useSpring(rawY, { stiffness: 50, damping: 18 })

  function handleMouseMove(e: React.MouseEvent) {
    const rect = sectionRef.current?.getBoundingClientRect()
    if (!rect) return
    rawX.set((e.clientX - rect.left) / rect.width - 0.5)
    rawY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden border-b border-border"
    >
      {/* Graph paper texture + radial fade */}
      <div aria-hidden="true" className="bg-grid-paper absolute inset-0" />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 40%, transparent 30%, oklch(0.955 0.004 91) 100%)',
        }}
      />

      {/* Scanning line sweeping the hero */}
      <div
        aria-hidden="true"
        className="animate-scanline absolute left-0 h-px w-full bg-primary/50"
      >
        <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-b from-transparent to-primary/8" />
      </div>

      {/* Floating receipt objects (desktop) */}
      <div aria-hidden="true" className="absolute inset-0 hidden md:block">
        {receipts.map((spec) => (
          <FloatingReceipt key={spec.id} spec={spec} mx={mx} my={my} />
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pt-12 pb-16 md:px-8 md:pt-16 md:pb-24">
        {/* Top meta row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-10 flex items-center gap-3 font-mono text-[10px] tracking-widest text-muted-foreground uppercase md:mb-14 md:text-xs"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 bg-primary" />
          </span>
          <span>Live &mdash; scanning 40+ billing portals</span>
        </motion.div>

        {/* Massive headline: word-level reveal, mixed solid / outline */}
        <h1 className="max-w-[14ch] text-[13.5vw] leading-[0.9] font-bold tracking-[-0.045em] uppercase sm:text-[11vw] lg:text-[8.75rem]">
          <span className="block overflow-hidden">
            <span className="block">
              {line1.map((word, i) => (
                <motion.span
                  key={word}
                  className="mr-[0.22em] inline-block last:mr-0"
                  initial={{ y: '115%', rotate: 4 }}
                  animate={{ y: 0, rotate: 0 }}
                  transition={{ duration: 0.9, delay: 0.15 + i * 0.09, ease }}
                >
                  {word}
                </motion.span>
              ))}
            </span>
          </span>
          <span className="block overflow-hidden">
            <span className="block">
              {line2.map((word, i) => (
                <motion.span
                  key={word}
                  className={`mr-[0.22em] inline-block last:mr-0 ${i === 1 ? 'text-outline' : ''}`}
                  initial={{ y: '115%', rotate: 4 }}
                  animate={{ y: 0, rotate: 0 }}
                  transition={{ duration: 0.9, delay: 0.33 + i * 0.09, ease }}
                >
                  {word}
                </motion.span>
              ))}
            </span>
          </span>
          <span className="block overflow-hidden">
            <motion.span
              className="relative inline-block"
              initial={{ y: '115%', rotate: 4 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 0.9, delay: 0.51, ease }}
            >
              {/* Red highlight sweep behind the word */}
              <motion.span
                aria-hidden="true"
                className="absolute inset-x-[-0.08em] inset-y-[0.02em] origin-left bg-primary"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 1.05, ease }}
              />
              <motion.span
                className="relative px-[0.04em]"
                initial={{ color: 'var(--foreground)' }}
                animate={{ color: 'var(--primary-foreground)' }}
                transition={{ duration: 0.3, delay: 1.25 }}
              >
                Forgotten.
              </motion.span>
            </motion.span>
          </span>
        </h1>

        {/* Sub + CTA row */}
        <div className="mt-10 flex flex-col gap-8 md:mt-14 md:max-w-[60%] lg:max-w-[55%]">
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.85, ease }}
            className="max-w-md text-base leading-relaxed text-pretty text-muted-foreground md:text-lg"
          >
            Papertrail is a browser extension that silently detects invoices in Gmail and pulls
            PDFs from AWS, OpenAI, Stripe, Vercel and 40+ other portals. Your accountant gets one
            tidy folder. You get your evenings back.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1, ease }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <a
              href="#pricing"
              className="group flex items-center justify-center gap-3 bg-primary px-8 py-4 text-sm font-bold tracking-wide text-primary-foreground uppercase transition-colors hover:bg-foreground hover:text-background"
            >
              Install free
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </a>
            <a
              href="#how-it-works"
              className="flex items-center justify-center gap-3 border border-foreground px-8 py-4 text-sm font-bold tracking-wide uppercase transition-colors hover:bg-foreground hover:text-background"
            >
              See how it works
            </a>
          </motion.div>
        </div>

        {/* Counter strip */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.15, ease }}
          className="mt-14 flex flex-wrap items-end justify-between gap-6 border-t border-border pt-8 md:mt-20"
          aria-label="14,208 receipts recovered this week"
        >
          <div>
            <p className="font-bold tracking-[-0.05em] whitespace-nowrap">
              <span className="text-outline text-[13vw] leading-none lg:text-[8rem]">
                <AnimatedCounter target={14208} />
              </span>
              <span className="ml-3 align-baseline text-[3.2vw] text-foreground lg:text-3xl">
                receipts
              </span>
            </p>
            <p className="mt-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase md:text-xs">
              Recovered for customers this week &mdash; without anyone opening an inbox
            </p>
          </div>
          <div className="hidden font-mono text-[10px] tracking-widest text-muted-foreground uppercase md:block md:text-xs">
            Chrome &middot; Edge &middot; Arc
          </div>
        </motion.div>
      </div>

      {/* Rotated ticker tape crossing the hero bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 bottom-16 hidden rotate-[-4deg] lg:block"
      >
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 1.5, ease }}
          className="flex w-[560px] overflow-hidden bg-foreground py-2"
        >
          <div className="animate-marquee flex shrink-0 items-center gap-6 pr-6 font-mono text-[10px] font-bold tracking-[0.25em] text-background uppercase">
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="flex items-center gap-6">
                <span>Auto-filed</span>
                <span className="text-primary">&#9632;</span>
                <span>Zero clicks</span>
                <span className="text-primary">&#9632;</span>
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
