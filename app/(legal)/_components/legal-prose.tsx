import type { ReactNode } from "react"

// Shared presentational primitives for the legal pages so Privacy / Terms /
// Security share one consistent, readable typographic system.

export function LegalHeader({
  title,
  updated,
  intro,
}: {
  title: string
  updated: string
  intro: string
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border/60 pb-8">
      <p className="font-mono text-[11px] tracking-widest text-primary uppercase">
        Legal
      </p>
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">{intro}</p>
      <p className="text-xs text-muted-foreground/70">Last updated {updated}</p>
    </header>
  )
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3 border-b border-border/40 py-8 last:border-0">
      <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-medium [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  )
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span
            className="mt-[0.5rem] size-1.5 shrink-0 rounded-full bg-primary/60"
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
