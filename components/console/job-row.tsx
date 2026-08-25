'use client'

import { Check, Phone } from 'lucide-react'
import { StringBedMeter } from '@/components/domain/string-bed-meter'
import { TensionReadout } from '@/components/domain/tension-pair'
import { getString } from '@/lib/mock-data'
import { useJobStore } from './job-store'
import { formatWhen } from '@/lib/units'
import { lifeAriaLabel, lifeSummary, stringLife } from '@/lib/string-life'
import type { Job, Unit } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * One line per job. Everything a stringer needs to pick up the right frame
 * without opening anything: who, what, tension, and how late it is.
 */
export function JobRow({
  job,
  unit,
  action,
  onAction,
}: {
  job: Job
  unit: Unit
  action?: 'ready' | 'collected'
  onAction?: () => void
}) {
  const { customerById, racketById, modelForRacket } = useJobStore()
  const customer = customerById(job.customerId)
  const racket = racketById(job.racketId)
  const model = modelForRacket(job.racketId)
  const mains = getString(job.mainsStringId)
  const crosses = getString(job.crossesStringId)
  const life = job.strungAt ? stringLife(job) : null

  const overdue =
    job.status === 'queue' &&
    job.promisedAt !== undefined &&
    new Date(job.promisedAt).getTime() < Date.now()

  return (
    <li className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
      <div className={cn('shrink-0', life ? '' : 'text-muted-foreground')}>
        <StringBedMeter
          pattern={model.pattern}
          percent={life?.percent ?? 100}
          state={life?.state ?? 'fresh'}
          size={36}
          label={
            life
              ? lifeAriaLabel(life)
              : `${model.brand} ${model.model}, not yet strung`
          }
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate font-medium">{customer.name}</p>
          {overdue && (
            <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--dead)]">
              late
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {model.model}
          {racket.nickname ? ` · ${racket.nickname}` : ''} ·{' '}
          {mains.id === crosses.id ? mains.name : `${mains.name}/${crosses.name}`}
        </p>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <TensionReadout
            mainsLb={job.tensionMainsLb}
            crossesLb={job.tensionCrossesLb}
            unit={unit}
            className="text-foreground"
          />
          {job.promisedAt && job.status === 'queue' && (
            <span className="tabular">{formatWhen(job.promisedAt)}</span>
          )}
          {life && job.status !== 'queue' && (
            <span className="tabular">{lifeSummary(life)}</span>
          )}
          {job.twoPiece && <span className="font-mono">2pc</span>}
        </p>
      </div>

      {action === 'ready' && (
        <button
          type="button"
          onClick={onAction}
          className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-transform active:scale-95"
        >
          <Check className="size-5" />
          <span className="sr-only">Mark {customer.name}&apos;s racket ready</span>
        </button>
      )}

      {action === 'collected' && (
        <button
          type="button"
          onClick={onAction}
          className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border text-foreground transition-transform active:scale-95"
        >
          <Check className="size-5" />
          <span className="sr-only">Mark collected by {customer.name}</span>
        </button>
      )}

      {job.status === 'collected' && (
        <a
          href={`tel:${customer.phone.replace(/\s/g, '')}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground"
        >
          <Phone className="size-4" />
          <span className="sr-only">Call {customer.name}</span>
        </a>
      )}
    </li>
  )
}
