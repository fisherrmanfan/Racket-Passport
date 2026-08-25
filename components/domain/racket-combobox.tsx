'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Loader2, Search, WifiOff } from 'lucide-react'
import { searchRackets } from '@/lib/catalog-client'
import { specSummary, tensionRangeLabel, type CatalogRacket } from '@/lib/catalog'
import type { Sport } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Async catalogue search over 2,700 frames (FRONTEND doc §5).
 *
 * Debounce 200ms, key specs in the option row, "can't find it? add it" at the
 * bottom. The search is word-order independent and typo-tolerant, so a
 * stringer types what's printed on the frame — "aero 98", "blaed" — and gets
 * the right row without knowing the catalogue's naming.
 *
 * Every request is abortable: on a bench connection the fourth keystroke must
 * not be overtaken by the answer to the second.
 */

const DEBOUNCE_MS = 200

export interface RacketComboboxProps {
  sport?: Sport
  onSelect: (racket: CatalogRacket) => void
  /** Rendered when nothing matches — the catalogue contribution path (§10). */
  onMissing?: (query: string) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

export function RacketCombobox({
  sport = 'tennis',
  onSelect,
  onMissing,
  placeholder = 'Search 2,700 frames — "aero 98", "blade"',
  autoFocus,
  className,
}: RacketComboboxProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CatalogRacket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState(0)
  /** The query the current `results` actually answer — avoids a flash of stale rows. */
  const [answered, setAnswered] = useState('')

  const listId = useId()
  const abortRef = useRef<AbortController | null>(null)
  const itemsRef = useRef<Array<HTMLButtonElement | null>>([])

  const run = useCallback(
    async (raw: string) => {
      const q = raw.trim()
      abortRef.current?.abort()

      if (q.length < 2) {
        setResults([])
        setAnswered(q)
        setLoading(false)
        setError(null)
        return
      }

      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      setError(null)

      try {
        const rackets = await searchRackets(q, { sport, signal: controller.signal })
        if (controller.signal.aborted) return
        setResults(rackets)
        setAnswered(q)
        setActive(0)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setResults([])
        setError((err as Error).message)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    },
    [sport],
  )

  useEffect(() => {
    const timer = setTimeout(() => void run(query), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, run])

  useEffect(() => () => abortRef.current?.abort(), [])

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const next =
        event.key === 'ArrowDown'
          ? (active + 1) % results.length
          : (active - 1 + results.length) % results.length
      setActive(next)
      itemsRef.current[next]?.scrollIntoView({ block: 'nearest' })
    } else if (event.key === 'Enter') {
      event.preventDefault()
      onSelect(results[active])
    } else if (event.key === 'Escape') {
      setQuery('')
      setResults([])
    }
  }

  const settled = !loading && answered === query.trim()
  const showEmpty = settled && !error && query.trim().length >= 2 && results.length === 0

  return (
    <div className={cn('flex min-h-0 flex-col gap-3', className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
          type="search"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Search the racket catalogue"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="h-12 w-full rounded-md border border-border bg-card pl-9 pr-10 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-md border border-border bg-card px-3 py-3 text-sm text-muted-foreground">
          <WifiOff className="mt-0.5 size-4 shrink-0" />
          <span>
            {error} Add the racket by hand and the specs will fill in when
            you&apos;re back online.
          </span>
        </p>
      )}

      <ul id={listId} role="listbox" className="flex min-h-0 flex-col gap-2 overflow-y-auto">
        {results.map((racket, index) => (
          <li key={racket.catalogId} role="option" aria-selected={index === active}>
            <button
              ref={(el) => {
                itemsRef.current[index] = el
              }}
              type="button"
              onMouseEnter={() => setActive(index)}
              onClick={() => onSelect(racket)}
              className={cn(
                'flex w-full items-center gap-3 rounded-md border bg-card p-3 text-left transition-colors',
                index === active ? 'border-primary' : 'border-border',
              )}
            >
              <RacketThumb racket={racket} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{racket.model}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {racket.brand}
                </span>
                <span className="tabular mt-0.5 block truncate font-mono text-[11px] text-muted-foreground">
                  {specSummary(racket) || 'Specs not on file'}
                  {tensionRangeLabel(racket) ? ` · ${tensionRangeLabel(racket)}` : ''}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {query.trim().length < 2 && !error && (
        <p className="px-1 text-xs text-muted-foreground">
          Two characters is enough. Word order doesn&apos;t matter, and typos are fine.
        </p>
      )}

      {showEmpty && (
        <div className="rounded-md border border-dashed border-border px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing in the catalogue matches &ldquo;{query.trim()}&rdquo;.
          </p>
          {onMissing && (
            <button
              type="button"
              onClick={() => onMissing(query.trim())}
              className="mt-3 text-sm font-medium underline underline-offset-4"
            >
              Add it yourself
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Catalogue photos live in the pipeline's Supabase Storage bucket. They're a
 * recognition aid, not content — a missing one degrades to the frame's initial
 * rather than a broken-image icon or a layout shift.
 */
function RacketThumb({ racket }: { racket: CatalogRacket }) {
  const [failed, setFailed] = useState(false)
  const src = racket.thumbUrl ?? racket.fullUrl

  if (!src || failed) {
    return (
      <span className="flex size-12 shrink-0 items-center justify-center rounded border border-border bg-background font-display text-lg text-muted-foreground">
        {racket.brand.charAt(0) || '?'}
      </span>
    )
  }

  return (
    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-background">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="size-full object-contain"
      />
    </span>
  )
}
