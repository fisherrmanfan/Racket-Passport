'use client'

import { Minus, Plus, Link2, Link2Off } from 'lucide-react'
import { toLb, formatTension } from '@/lib/units'
import type { Unit } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Mains and crosses, entered together, because that is how a stringer thinks.
 *
 * Locked by default: crosses track mains at the established offset (usually
 * 2lb lower). Unlocking is one tap and is remembered per job.
 *
 * Canonical value is always lb. The unit toggle is display-only — we convert
 * at the edge and never round-trip the stored number.
 */

const STEP_LB = 0.5

export interface TensionPairProps {
  mainsLb: number
  crossesLb: number
  unit: Unit
  linked: boolean
  onChange: (next: { mainsLb: number; crossesLb: number }) => void
  onLinkedChange: (linked: boolean) => void
  /** Advisory text shown under the control. Does not block. */
  warning?: string
  min?: number
  max?: number
}

export function TensionPair({
  mainsLb,
  crossesLb,
  unit,
  linked,
  onChange,
  onLinkedChange,
  warning,
  min = 12,
  max = 70,
}: TensionPairProps) {
  const offset = crossesLb - mainsLb

  const clamp = (lb: number) => Math.min(max, Math.max(min, lb))

  const setMains = (lb: number) => {
    const mains = clamp(lb)
    onChange({
      mainsLb: mains,
      crossesLb: linked ? clamp(mains + offset) : crossesLb,
    })
  }

  const setCrosses = (lb: number) => {
    const crosses = clamp(lb)
    onChange({
      mainsLb: linked ? clamp(crosses - offset) : mainsLb,
      crossesLb: crosses,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-2">
        <Stepper
          label="Mains"
          valueLb={mainsLb}
          unit={unit}
          onStep={(d) => setMains(mainsLb + d)}
          onSet={(lb) => setMains(lb)}
        />

        <button
          type="button"
          onClick={() => onLinkedChange(!linked)}
          aria-pressed={linked}
          className={cn(
            'mt-7 flex size-11 shrink-0 items-center justify-center rounded-md border transition-colors',
            linked
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-muted-foreground',
          )}
        >
          {linked ? <Link2 className="size-5" /> : <Link2Off className="size-5" />}
          <span className="sr-only">
            {linked ? 'Crosses follow mains. Tap to unlink.' : 'Crosses set separately. Tap to link.'}
          </span>
        </button>

        <Stepper
          label="Crosses"
          valueLb={crossesLb}
          unit={unit}
          onStep={(d) => setCrosses(crossesLb + d)}
          onSet={(lb) => setCrosses(lb)}
        />
      </div>

      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground tabular">
          {linked
            ? `Crosses ${offset === 0 ? 'match' : `${offset > 0 ? '+' : ''}${formatTension(Math.abs(offset), unit)} ${offset > 0 ? 'above' : 'below'}`} mains`
            : 'Set independently'}
        </span>
        {warning ? (
          <span className="text-right font-medium text-[var(--fading)]">{warning}</span>
        ) : null}
      </div>
    </div>
  )
}

interface StepperProps {
  label: string
  valueLb: number
  unit: Unit
  onStep: (deltaLb: number) => void
  onSet: (lb: number) => void
}

function Stepper({ label, valueLb, unit, onStep, onSet }: StepperProps) {
  const displayed = formatTension(valueLb, unit)

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => onStep(-STEP_LB)}
          className="flex size-10 shrink-0 items-center justify-center rounded text-foreground transition-colors hover:bg-accent active:bg-accent"
        >
          <Minus className="size-4" />
          <span className="sr-only">Decrease {label}</span>
        </button>

        <input
          type="text"
          inputMode="decimal"
          value={displayed}
          onChange={(e) => {
            const parsed = Number.parseFloat(e.target.value)
            if (!Number.isNaN(parsed)) onSet(toLb(parsed, unit))
          }}
          aria-label={`${label} tension in ${unit}`}
          className="tabular min-w-0 flex-1 bg-transparent text-center font-display text-3xl font-semibold text-foreground outline-none"
        />

        <button
          type="button"
          onClick={() => onStep(STEP_LB)}
          className="flex size-10 shrink-0 items-center justify-center rounded text-foreground transition-colors hover:bg-accent active:bg-accent"
        >
          <Plus className="size-4" />
          <span className="sr-only">Increase {label}</span>
        </button>
      </div>
    </div>
  )
}

/** Read-only rendering of a stored pair. Used in lists and the passport. */
export function TensionReadout({
  mainsLb,
  crossesLb,
  unit,
  className,
}: {
  mainsLb: number
  crossesLb: number
  unit: Unit
  className?: string
}) {
  const same = mainsLb === crossesLb
  return (
    <span className={cn('tabular font-mono', className)}>
      {same
        ? `${formatTension(mainsLb, unit)}${unit}`
        : `${formatTension(mainsLb, unit)} / ${formatTension(crossesLb, unit)}${unit}`}
    </span>
  )
}
