import type { Unit } from './types'

const LB_PER_KG = 2.2046226218

/** Display-only conversion. Stored value stays in lb, always. */
export function fromLb(lb: number, unit: Unit): number {
  return unit === 'lb' ? lb : lb / LB_PER_KG
}

export function toLb(value: number, unit: Unit): number {
  return unit === 'lb' ? value : value * LB_PER_KG
}

/** Tensions read aloud across a workshop: one decimal at most. */
export function formatTension(lb: number, unit: Unit): string {
  const v = fromLb(lb, unit)
  const rounded = Math.round(v * 2) / 2
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

/** mm is primary; the US gauge number is a secondary label. Both are in daily use. */
const US_GAUGE: Array<[number, string]> = [
  [1.15, '18'],
  [1.2, '17L'],
  [1.25, '17'],
  [1.3, '16L'],
  [1.35, '15L'],
  [1.4, '15'],
]

export function usGauge(mm: number): string | undefined {
  let best: [number, string] | undefined
  let bestDelta = Number.POSITIVE_INFINITY
  for (const entry of US_GAUGE) {
    const delta = Math.abs(entry[0] - mm)
    if (delta < bestDelta) {
      bestDelta = delta
      best = entry
    }
  }
  return bestDelta <= 0.03 ? best?.[1] : undefined
}

export function formatGauge(mm: number): string {
  return `${mm.toFixed(2)}mm`
}

export function formatMoney(cents: number, symbol: string): string {
  return `${symbol} ${(cents / 100).toFixed(2).replace(/\.00$/, '')}`
}

/** Relative for recent, absolute beyond 7 days. */
export function formatWhen(iso: string, now = new Date()): string {
  const then = new Date(iso)
  const diffMs = then.getTime() - now.getTime()
  const absHours = Math.abs(diffMs) / 3_600_000
  const future = diffMs > 0

  if (absHours < 1) {
    const mins = Math.max(1, Math.round(Math.abs(diffMs) / 60_000))
    return future ? `in ${mins}m` : `${mins}m ago`
  }
  if (absHours < 24) {
    const hours = Math.round(absHours)
    return future ? `in ${hours}h` : `${hours}h ago`
  }
  const days = Math.round(absHours / 24)
  if (days <= 7) {
    if (future) {
      return days === 1
        ? 'tomorrow'
        : `due ${then.toLocaleDateString('en-GB', { weekday: 'short' })}`
    }
    return days === 1 ? 'yesterday' : `${days}d ago`
  }
  return then.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
