'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useJobStore } from './job-store'
import { JobRow } from './job-row'
import { NewJobSheet } from './new-job-sheet'
import { ConsoleShell } from '@/components/shell/console-shell'
import { BRAND } from '@/lib/brand'
import { formatMoney } from '@/lib/units'
import type { Job } from '@/lib/types'

/**
 * Today. The screen a stringer lives on.
 *
 * On a phone the queue comes first and everything else is below the fold,
 * because that is the work. On a bench iPad or a laptop all three lists sit
 * side by side — the whole day visible without scrolling, which is the actual
 * reason the console is tablet-first (FRONTEND doc §1).
 */
export function TodayScreen() {
  const { jobs, unit, setUnit, markReady, markCollected, flash, clearFlash } =
    useJobStore()
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(clearFlash, 2600)
    return () => clearTimeout(t)
  }, [flash, clearFlash])

  const queue = jobs.filter((j) => j.status === 'queue')
  const ready = jobs.filter((j) => j.status === 'ready')
  const dueSoon = jobs
    .filter((j) => j.status === 'collected' && j.dueAt)
    .filter((j) => new Date(j.dueAt as string).getTime() <= Date.now() + 7 * 86_400_000)
    .sort(
      (a, b) =>
        new Date(a.dueAt as string).getTime() - new Date(b.dueAt as string).getTime(),
    )

  const takingsCents = ready.reduce((sum, j) => sum + j.priceCents, 0)

  const unitToggle = (
    <button
      type="button"
      onClick={() => setUnit(unit === 'lb' ? 'kg' : 'lb')}
      className="tabular flex h-10 items-center rounded-md border border-border px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
    >
      {unit}
      <span className="sr-only">
        Switch tension display to {unit === 'lb' ? 'kilograms' : 'pounds'}
      </span>
    </button>
  )

  return (
    <ConsoleShell
      actions={
        <>
          {unitToggle}
          {/* On a phone this lives in the thumb zone instead — see below. */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="hidden h-10 items-center gap-2 rounded-md bg-primary px-4 font-display text-sm font-bold uppercase tracking-wide text-primary-foreground transition-transform active:scale-[0.98] md:flex"
          >
            <Plus className="size-4" />
            New job
          </button>
        </>
      }
    >
      <div className="flex items-baseline justify-between gap-3 pt-6 pb-4">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide md:text-4xl">
          Today
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: '2-digit',
            month: 'short',
          })}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <Stat label="In queue" value={String(queue.length)} />
        <Stat label="Ready" value={String(ready.length)} />
        <Stat
          label="Uncollected"
          value={formatMoney(takingsCents, BRAND.currencySymbol)}
        />
      </div>

      {/* One column on a phone, three on a bench device. */}
      <div className="mt-7 grid items-start gap-x-6 gap-y-7 md:grid-cols-2 lg:grid-cols-3">
        <Section title="Queue" count={queue.length}>
          {queue.length === 0 ? (
            <Empty>Bench is clear.</Empty>
          ) : (
            queue.map((j) => (
              <JobRow
                key={j.id}
                job={j}
                unit={unit}
                action="ready"
                onAction={() => markReady(j.id)}
              />
            ))
          )}
        </Section>

        <Section title="Ready for pickup" count={ready.length}>
          {ready.length === 0 ? (
            <Empty>Nothing waiting on a shelf.</Empty>
          ) : (
            ready.map((j) => (
              <JobRow
                key={j.id}
                job={j}
                unit={unit}
                action="collected"
                onAction={() => markCollected(j.id)}
              />
            ))
          )}
        </Section>

        {/*
          Two columns can't divide three lists evenly, and "Due this week" is
          reliably the longest — so at tablet width it takes the full row
          rather than leaving a hole beside the short "Ready" column.
        */}
        <Section
          title="Due this week"
          count={dueSoon.length}
          className="md:col-span-2 lg:col-span-1"
        >
          {dueSoon.length === 0 ? (
            <Empty>No one is running on dead strings.</Empty>
          ) : (
            dueSoon.map((j: Job) => <JobRow key={j.id} job={j} unit={unit} />)
          )}
        </Section>
      </div>

      {/* Flash confirmation */}
      {flash && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-md border border-border bg-card px-4 py-2 text-sm text-card-foreground shadow-lg md:bottom-6"
        >
          {flash}
        </div>
      )}

      {/* Phone only: primary action in the bottom third, one-handed (§10). */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto max-w-md p-4">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary font-display text-lg font-bold uppercase tracking-wide text-primary-foreground transition-transform active:scale-[0.99]"
          >
            <Plus className="size-5" />
            New job
          </button>
        </div>
      </div>

      <NewJobSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </ConsoleShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 md:px-4 md:py-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="tabular font-display text-xl font-semibold md:text-2xl">{value}</p>
    </div>
  )
}

function Section({
  title,
  count,
  className,
  children,
}: {
  title: string
  count: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={className}>
      <h2 className="mb-2 flex items-baseline gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {title}
        <span className="tabular">{count}</span>
      </h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </li>
  )
}
