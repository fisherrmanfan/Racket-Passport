'use client'

import { useEffect, useRef, useState } from 'react'
import type { MeterState, StringPattern } from '@/lib/types'

/**
 * The signature element: an actual string bed, drawn at the racket's real
 * pattern, that goes visibly slack as the strings die.
 *
 * Fresh   — taut, full opacity, tight even spacing
 * Fading  — spacing loosens, opacity drops
 * Dead    — visibly slack, sagging curves
 * Snapped — two mains drawn broken
 *
 * Animates once on mount over ~600ms from taut to true state. Skipped at
 * 24px (lists of 50 must render inside a frame) and under reduced motion.
 */

const CX = 50
const CY = 52
const RX = 38
const RY = 48
const FRAME = 3.6
const RX_IN = RX - FRAME
const RY_IN = RY - FRAME

const STATE_COLOR: Record<MeterState, string> = {
  fresh: 'var(--fresh)',
  fading: 'var(--fading)',
  dead: 'var(--dead)',
  snapped: 'var(--dead)',
}

function chord(ratio: number, radius: number) {
  const clamped = Math.min(0.985, Math.abs(ratio))
  return radius * Math.sqrt(1 - clamped * clamped)
}

interface Geometry {
  mains: string[]
  crosses: string[]
  brokenMains: string[]
}

/**
 * Slack is the whole point, so it drives sag depth, per-string jitter, and
 * opacity together. Everything sags downward — gravity has one direction, and
 * a symmetric bulge reads as a barrel rather than a dead bed.
 */
function buildGeometry(
  pattern: StringPattern,
  slack: number,
  snapped: boolean,
  detail: number,
): Geometry {
  // Sample the real pattern down at small sizes so it stays a bed, not a blob.
  const mainCount = Math.max(5, Math.round(pattern.mains * detail))
  const crossCount = Math.max(6, Math.round(pattern.crosses * detail))

  const sag = 11 * slack * slack

  const mains: string[] = []
  const brokenMains: string[] = []
  // A snapped bed is missing a visible cluster through the sweet spot.
  const mid = Math.floor(mainCount / 2)
  const brokenIndexes = snapped ? [mid - 1, mid, mid + 1] : []

  // Deterministic jitter — the same racket always draws the same way.
  const jitter = (i: number, k: number) =>
    Math.sin(i * 12.9898 + k * 78.233) * slack * 1.6

  for (let i = 0; i < mainCount; i++) {
    const t = ((i + 0.5) / mainCount) * 2 - 1
    const x = CX + t * (RX_IN * 0.88) + jitter(i, 1)
    const halfSpan = chord((x - CX) / RX_IN, RY_IN)
    const top = CY - halfSpan
    const bottom = CY + halfSpan
    const shape = halfSpan / RY_IN
    // Everything sags DOWN. Gravity has one direction.
    const droop = sag * 0.55 * shape + jitter(i, 2)

    if (brokenIndexes.includes(i)) {
      // Broken: short curled stubs at the frame, nothing across the middle.
      const stub = halfSpan * 0.3
      brokenMains.push(`M ${x} ${top} Q ${x + 4} ${top + stub} ${x - 2} ${top + stub * 1.5}`)
      brokenMains.push(
        `M ${x + 1} ${bottom - stub * 1.5} Q ${x - 4} ${bottom - stub} ${x} ${bottom}`,
      )
      continue
    }

    mains.push(`M ${x} ${top} Q ${x + jitter(i, 5) * 1.2} ${CY + droop} ${x} ${bottom}`)
  }

  const crosses: string[] = []
  for (let i = 0; i < crossCount; i++) {
    const t = ((i + 0.5) / crossCount) * 2 - 1
    const y = CY + t * (RY_IN * 0.86) + jitter(i, 3)
    const halfSpan = chord((y - CY) / RY_IN, RX_IN)
    const left = CX - halfSpan
    const right = CX + halfSpan
    const shape = halfSpan / RX_IN
    // Crosses hang the most — the clearest "loose" cue.
    const droop = sag * 1.15 * shape + jitter(i, 4)

    crosses.push(`M ${left} ${y} Q ${CX} ${y + droop} ${right} ${y}`)
  }

  return { mains, crosses, brokenMains }
}

export interface StringBedMeterProps {
  pattern: StringPattern
  /** 0–100 string life. */
  percent: number
  state: MeterState
  /** 24 = list row, 96 = racket card, 240 = passport hero. */
  size?: 24 | 96 | 240 | number
  /** Accessible description. Never "chart". */
  label: string
  className?: string
}

export function StringBedMeter({
  pattern,
  percent,
  state,
  size = 96,
  label,
  className,
}: StringBedMeterProps) {
  const snapped = state === 'snapped'
  const targetSlack = snapped ? 1 : 1 - Math.max(0, Math.min(100, percent)) / 100
  // Lists of 50 rows must not run 50 animations.
  const animates = size >= 64
  const [progress, setProgress] = useState(animates ? 0 : 1)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!animates) return
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setProgress(1)
      return
    }

    const start = performance.now()
    const duration = 600
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      // ease-out-cubic
      setProgress(1 - Math.pow(1 - p, 3))
      if (p < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [animates])

  const slack = targetSlack * progress

  // Below ~64px a full 16x19 bed turns into a solid blob, so thin it out.
  const detail = size >= 120 ? 1 : size >= 64 ? 0.7 : 0.42
  const { mains, crosses, brokenMains } = buildGeometry(pattern, slack, snapped, detail)
  const color = STATE_COLOR[state]
  const opacity = 1 - 0.35 * slack
  const stroke = size <= 32 ? 3.4 : size <= 48 ? 2.8 : size <= 120 ? 1.7 : 1.25
  const showThroat = size >= 96
  const height = showThroat ? 132 : 108

  return (
    <svg
      width={size}
      height={(size / 100) * height}
      viewBox={`0 0 100 ${height}`}
      role="img"
      aria-label={label}
      className={className}
      style={{ overflow: 'visible' }}
    >
      {/* Frame */}
      <ellipse
        cx={CX}
        cy={CY}
        rx={RX}
        ry={RY}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.4}
        strokeWidth={size <= 32 ? 4 : 2.6}
      />
      {showThroat && (
        <g stroke="currentColor" strokeOpacity={0.4} strokeWidth={2.6} fill="none">
          <path d="M 30 92 Q 42 108 44 116" />
          <path d="M 70 92 Q 58 108 56 116" />
          <path d="M 44 116 L 56 116" strokeWidth={7} strokeLinecap="round" />
        </g>
      )}

      <g
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        opacity={opacity}
      >
        {crosses.map((d, i) => (
          <path key={`c-${i}`} d={d} strokeOpacity={0.78} />
        ))}
        {mains.map((d, i) => (
          <path key={`m-${i}`} d={d} />
        ))}
        {brokenMains.map((d, i) => (
          <path key={`b-${i}`} d={d} strokeOpacity={0.9} />
        ))}
      </g>
    </svg>
  )
}
