'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, BellOff } from 'lucide-react'
import { StringBedMeter } from '@/components/domain/string-bed-meter'
import { TensionReadout } from '@/components/domain/tension-pair'
import { SurfaceSwitcher } from '@/components/shell/surface-switcher'
import { customers, getString, jobs, racketModels, rackets } from '@/lib/mock-data'
import { lifeAriaLabel, lifeSummary, stateLabel, stringLife } from '@/lib/string-life'
import { formatDate } from '@/lib/units'
import { BRAND } from '@/lib/brand'
import type { Job, RacketModel, Unit } from '@/lib/types'

/**
 * The player's own view (FRONTEND doc §4.5). Deliberately not the console:
 * paper rather than the bench, low density, one card per racket, read on a
 * sofa rather than standing at a machine.
 *
 * Phone-first, and on a wide screen it stays a single readable column rather
 * than stretching — there are only ever a handful of rackets in a bag.
 */

/** Standing in for a session until auth lands. */
const PLAYER_ID = 'c-alex'

export function MyRackets() {
  const [unit, setUnit] = useState<Unit>('kg')
  const [paused, setPaused] = useState(false)

  const player = customers.find((c) => c.id === PLAYER_ID)
  const owned = rackets.filter((r) => r.customerId === PLAYER_ID)

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-lg items-center gap-3 px-5">
          <Link href="/" className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-display text-base font-bold uppercase tracking-wide">
              {BRAND.name}
            </span>
            <span className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {player?.name ?? 'Player'}
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <SurfaceSwitcher />
            <button
              type="button"
              onClick={() => setUnit(unit === 'lb' ? 'kg' : 'lb')}
              className="tabular flex h-10 items-center rounded-md border border-border px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground"
            >
              {unit}
              <span className="sr-only">
                Switch tension display to {unit === 'lb' ? 'kilograms' : 'pounds'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-5 pb-16">
        <h1 className="pt-8 pb-5 font-display text-3xl font-bold uppercase tracking-wide">
          My rackets
        </h1>

        <ul className="flex flex-col gap-4">
          {owned.map((racket) => {
            const last = jobs
              .filter((j) => j.racketId === racket.id && j.strungAt)
              .sort(
                (a, b) =>
                  new Date(b.strungAt as string).getTime() -
                  new Date(a.strungAt as string).getTime(),
              )[0]
            const model = racketModels.find((m) => m.id === racket.modelId)
            if (!model) return null

            return (
              <li key={racket.id}>
                <RacketCard
                  job={last}
                  model={model}
                  nickname={racket.nickname}
                  unit={unit}
                />
              </li>
            )
          })}
        </ul>

        {/*
          Pause must be reachable in one tap from the player's home screen
          (FRONTEND doc §4.5). Notification fatigue is the product's whole risk
          profile, and people who can leave freely don't leave.
        */}
        <div className="mt-8 flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Restring reminders</p>
            <p className="text-xs text-muted-foreground">
              {paused ? 'Paused — nothing will be sent.' : 'On, over WhatsApp.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPaused(!paused)}
            aria-pressed={paused}
            className="flex h-11 shrink-0 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium"
          >
            {paused ? <Bell className="size-4" /> : <BellOff className="size-4" />}
            {paused ? 'Resume' : 'Pause all'}
          </button>
        </div>
      </main>
    </div>
  )
}

function RacketCard({
  job,
  model,
  nickname,
  unit,
}: {
  job: Job | undefined
  model: RacketModel
  nickname?: string
  unit: Unit
}) {
  const life = job ? stringLife(job) : null
  const mains = job ? getString(job.mainsStringId) : null
  const crosses = job ? getString(job.crossesStringId) : null

  return (
    <article className="flex gap-4 rounded-lg border border-border bg-card p-5">
      <div className="shrink-0 text-ink-300">
        <StringBedMeter
          pattern={model.pattern}
          percent={life?.percent ?? 100}
          state={life?.state ?? 'fresh'}
          size={96}
          label={
            life ? lifeAriaLabel(life) : `${model.brand} ${model.model}, not yet strung`
          }
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Never colour-alone: the state is spelled out beside the meter (§10). */}
        {life && (
          <p className="tabular font-display text-2xl font-semibold leading-none">
            {life.percent}%
            <span className="ml-2 align-middle font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {stateLabel(life.state)}
            </span>
          </p>
        )}

        <h2 className="mt-2 font-medium text-pretty">
          {model.brand} {model.model}
          {nickname ? <span className="text-muted-foreground"> · {nickname}</span> : null}
        </h2>

        {job && mains && crosses ? (
          <>
            <p className="tabular mt-1 font-mono text-xs text-muted-foreground">
              {mains.id === crosses.id ? mains.name : `${mains.name} / ${crosses.name}`}{' '}
              {job.gaugeMm.toFixed(2)}mm ·{' '}
              <TensionReadout
                mainsLb={job.tensionMainsLb}
                crossesLb={job.tensionCrossesLb}
                unit={unit}
              />
            </p>
            <p className="tabular mt-1 font-mono text-xs text-muted-foreground">
              Strung {formatDate(job.strungAt as string)}
              {life ? ` · ${lifeSummary(life)}` : ''}
            </p>
          </>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Not strung yet.</p>
        )}

        <button
          type="button"
          className="mt-3 flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-transform active:scale-[0.99]"
        >
          Request restring
        </button>
      </div>
    </article>
  )
}
