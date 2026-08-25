'use client'

import Link from 'next/link'
import { BRAND } from '@/lib/brand'
import { SurfaceSwitcher } from './surface-switcher'

/**
 * The stringer console's frame. Tablet-first (FRONTEND doc §1): the bench
 * device is an iPad or a laptop, so the header carries the identity and the
 * cross-surface nav, and the screen below it spreads into columns rather than
 * staying a phone-width strip.
 *
 * The dark bench palette is scoped by `.console` so the player and public
 * surfaces stay on paper.
 */
export function ConsoleShell({
  children,
  actions,
}: {
  children: React.ReactNode
  /** Screen-level controls — unit toggle, New job. Placed in the header on md+. */
  actions?: React.ReactNode
}) {
  return (
    <div className="console min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
          <Link href="/" className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-display text-base font-bold uppercase tracking-wide">
              {BRAND.tenantName}
            </span>
            <span className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {BRAND.name}
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <SurfaceSwitcher />
            {actions}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 md:px-6 md:pb-10">{children}</main>
    </div>
  )
}
