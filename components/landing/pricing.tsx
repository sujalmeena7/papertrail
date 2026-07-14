'use client'

import { motion } from 'framer-motion'
import { PRO_PRICE, PLANS as plans } from '@/lib/billing/pricing'

export function Pricing() {
  return (
    <section id="pricing" aria-label="Pricing" className="border-b border-border">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div className="mb-12 flex flex-col gap-4 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-primary uppercase md:text-xs">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance md:text-5xl">
              See the leak for free.
              <br />
              Fix it for {PRO_PRICE.usd}/mo.
            </h2>
          </div>
          <p className="max-w-xs font-mono text-[10px] leading-relaxed tracking-wider text-muted-foreground uppercase md:text-xs">
            No card required for Free &middot; Cancel Pro anytime
          </p>
        </div>

        <div className="grid gap-px bg-border md:grid-cols-2">
          {plans.map((plan, i) => (
            <motion.article
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`flex flex-col p-8 md:p-10 ${
                plan.featured ? 'bg-foreground text-background' : 'bg-background'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs tracking-widest uppercase">{plan.name}</h3>
                {plan.featured && (
                  <span className="bg-primary px-2 py-1 font-mono text-[9px] tracking-widest text-primary-foreground uppercase">
                    Most popular
                  </span>
                )}
              </div>
              <p className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">
                {plan.price}
                <span
                  className={`text-base font-normal ${
                    plan.featured ? 'text-background/60' : 'text-muted-foreground'
                  }`}
                >
                  {plan.period}
                </span>
              </p>
              {plan.note && (
                <p
                  className={`mt-1 text-xs ${
                    plan.featured ? 'text-background/60' : 'text-muted-foreground'
                  }`}
                >
                  {plan.note}
                </p>
              )}
              <p
                className={`mt-4 text-sm leading-relaxed ${
                  plan.featured ? 'text-background/70' : 'text-muted-foreground'
                }`}
              >
                {plan.description}
              </p>
              <ul className="mt-8 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-primary" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="/sign-up"
                className={`mt-10 flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold tracking-widest uppercase transition-colors ${
                  plan.featured
                    ? 'bg-primary text-primary-foreground hover:bg-background hover:text-foreground'
                    : 'border border-foreground hover:bg-foreground hover:text-background'
                }`}
              >
                {plan.cta}
                <span aria-hidden="true">&rarr;</span>
              </a>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
