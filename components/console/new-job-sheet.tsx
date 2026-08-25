'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, Check, Plus, Search, Zap } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StringBedMeter } from '@/components/domain/string-bed-meter'
import { TensionPair } from '@/components/domain/tension-pair'
import { RacketCombobox } from '@/components/domain/racket-combobox'
import { useJobStore } from './job-store'
import { getString, strings } from '@/lib/mock-data'
import { checkGuardrail, describeSetup, recommend, sameAgain } from '@/lib/recommend'
import { formatMoney, formatTension, formatWhen } from '@/lib/units'
import { BRAND } from '@/lib/brand'
import type { Customer, RacketInstance } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * The 20-second job. Three taps if history exists:
 *   customer → racket → SAME AGAIN → done.
 * The long form is always one tap away but never on the critical path.
 *
 * A racket the console has never seen is two extra taps: the catalogue step
 * searches all 2,700 frames, and picking one pulls its real pattern, RA and
 * tension range straight into the setup step.
 */

type Step = 'customer' | 'new-customer' | 'racket' | 'catalog' | 'setup'

export function NewJobSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { createJob, unit, customers, addCustomer, addRacket, racketsForCustomer } =
    useJobStore()
  const [step, setStep] = useState<Step>('customer')
  const [query, setQuery] = useState('')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [racket, setRacket] = useState<RacketInstance | null>(null)

  const reset = () => {
    setStep('customer')
    setQuery('')
    setCustomer(null)
    setRacket(null)
  }

  const close = () => {
    onOpenChange(false)
    // Let the sheet finish animating out before clearing.
    setTimeout(reset, 250)
  }

  const back = () => {
    if (step === 'setup') setStep(customer && racketsForCustomer(customer.id).length ? 'racket' : 'catalog')
    else if (step === 'catalog') setStep(racketsForCustomer(customer?.id ?? '').length ? 'racket' : 'customer')
    else setStep('customer')
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q),
    )
  }, [query, customers])

  /** Picking a customer skips ahead as far as their bag allows. */
  const pickCustomer = (c: Customer) => {
    setCustomer(c)
    const owned = racketsForCustomer(c.id)
    if (owned.length === 0) setStep('catalog')
    else if (owned.length === 1) {
      setRacket(owned[0])
      setStep('setup')
    } else setStep('racket')
  }

  const TITLES: Record<Step, string> = {
    customer: 'Who is it for',
    'new-customer': 'New customer',
    racket: 'Which racket',
    catalog: 'Find the frame',
    setup: 'Setup',
  }

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <SheetContent
        side="bottom"
        className="console flex max-h-[92vh] flex-col gap-0 overflow-y-auto border-t border-border bg-background p-0 text-foreground sm:max-w-md sm:mx-auto"
      >
        <SheetHeader className="flex-row items-center gap-3 border-b border-border p-4">
          {step !== 'customer' && (
            <button
              type="button"
              onClick={back}
              className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border"
            >
              <ArrowLeft className="size-4" />
              <span className="sr-only">Back</span>
            </button>
          )}
          <SheetTitle className="font-display text-lg font-semibold uppercase tracking-wide">
            {TITLES[step]}
          </SheetTitle>
        </SheetHeader>

        {step === 'customer' && (
          <div className="flex flex-col gap-3 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name or phone"
                className="h-12 border-border bg-card pl-9 text-base"
              />
            </div>
            <ul className="flex flex-col gap-2">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => pickCustomer(c)}
                    className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary"
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="tabular font-mono text-xs text-muted-foreground">
                      {racketsForCustomer(c.id).length} racket
                      {racketsForCustomer(c.id).length === 1 ? '' : 's'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setStep('new-customer')}
              className="flex h-12 items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm font-medium text-muted-foreground"
            >
              <Plus className="size-4" />
              New customer
            </button>
          </div>
        )}

        {step === 'new-customer' && (
          <NewCustomerStep
            initialName={query}
            onCreate={(name, phone) => pickCustomer(addCustomer(name, phone))}
          />
        )}

        {step === 'racket' && customer && (
          <div className="flex flex-col gap-2 p-4">
            {racketsForCustomer(customer.id).map((r) => (
              <RacketOption
                key={r.id}
                racket={r}
                onSelect={() => {
                  setRacket(r)
                  setStep('setup')
                }}
              />
            ))}
            <button
              type="button"
              onClick={() => setStep('catalog')}
              className="flex h-12 items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm font-medium text-muted-foreground"
            >
              <Plus className="size-4" />
              Add a racket
            </button>
          </div>
        )}

        {step === 'catalog' && customer && (
          <div className="flex min-h-0 flex-col gap-3 p-4">
            <p className="text-sm text-muted-foreground">
              Adding a frame to {customer.name}&apos;s bag. Its specs come from
              the catalogue — you won&apos;t have to type them.
            </p>
            <RacketCombobox
              autoFocus
              className="max-h-[52vh]"
              onSelect={(found) => {
                setRacket(addRacket(found, customer.id))
                setStep('setup')
              }}
            />
          </div>
        )}

        {step === 'setup' && customer && racket && (
          <SetupStep
            customer={customer}
            racket={racket}
            unit={unit}
            onConfirm={(payload) => {
              createJob(payload)
              close()
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function RacketOption({
  racket,
  onSelect,
}: {
  racket: RacketInstance
  onSelect: () => void
}) {
  const { modelForRacket, lastJobForRacket } = useJobStore()
  const model = modelForRacket(racket.id)
  const last = lastJobForRacket(racket.id)

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex items-center gap-3 rounded-md border border-border bg-card p-3 text-left transition-colors hover:border-primary"
    >
      <div className="text-muted-foreground">
        <StringBedMeter
          pattern={model.pattern}
          percent={100}
          state="fresh"
          size={40}
          label={`${model.brand} ${model.model}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {model.brand} {model.model}
          {racket.nickname ? (
            <span className="text-muted-foreground"> · {racket.nickname}</span>
          ) : null}
        </p>
        <p className="tabular font-mono text-xs text-muted-foreground">
          {racket.shortCode}
          {last?.strungAt ? ` · last ${formatWhen(last.strungAt)}` : ' · never strung'}
        </p>
      </div>
    </button>
  )
}

function NewCustomerStep({
  initialName,
  onCreate,
}: {
  initialName: string
  onCreate: (name: string, phone: string) => void
}) {
  // Whatever they typed into the search was almost certainly the name.
  const [name, setName] = useState(/\d/.test(initialName) ? '' : initialName)
  const [phone, setPhone] = useState(/\d/.test(initialName) ? initialName : '')

  return (
    <form
      className="flex flex-col gap-4 p-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (name.trim()) onCreate(name, phone)
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Name
        </span>
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12 border-border bg-card text-base"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Phone
        </span>
        <Input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+65 9123 4567"
          className="tabular h-12 border-border bg-card font-mono text-base"
        />
      </label>
      <Button
        type="submit"
        disabled={!name.trim()}
        className="h-14 w-full font-display text-lg font-bold uppercase tracking-wide"
      >
        Next — pick a racket
      </Button>
    </form>
  )
}

function SetupStep({
  customer,
  racket,
  unit,
  onConfirm,
}: {
  customer: Customer
  racket: RacketInstance
  unit: 'lb' | 'kg'
  onConfirm: (payload: {
    racketId: string
    customerId: string
    mainsStringId: string
    crossesStringId: string
    gaugeMm: number
    tensionMainsLb: number
    tensionCrossesLb: number
    priceCents: number
    promisedAt: string
  }) => void
}) {
  const { modelForRacket, lastJobForRacket } = useJobStore()
  const model = modelForRacket(racket.id)
  const last = lastJobForRacket(racket.id)
  const previous = sameAgain(last)
  const suggestion = useMemo(() => recommend(model, last), [model, last])

  const [expanded, setExpanded] = useState(!previous)
  const [tension, setTension] = useState({
    mainsLb: suggestion.tensionMainsLb,
    crossesLb: suggestion.tensionCrossesLb,
  })
  const [linked, setLinked] = useState(true)
  const [stringId, setStringId] = useState(suggestion.stringId)
  const [gaugeMm, setGaugeMm] = useState(suggestion.gaugeMm)

  const guardrail = checkGuardrail(model, tension.mainsLb)
  const priceCents = model.sport === 'badminton' ? 2200 : 3500

  const commit = (mainsLb: number, crossesLb: number, sId: string, gauge: number) =>
    onConfirm({
      racketId: racket.id,
      customerId: customer.id,
      mainsStringId: sId,
      crossesStringId: sId,
      gaugeMm: gauge,
      tensionMainsLb: mainsLb,
      tensionCrossesLb: crossesLb,
      priceCents,
      promisedAt: new Date(Date.now() + 24 * 3_600_000).toISOString(),
    })

  const selected = getString(stringId)
  const range =
    model.tensionMinLb && model.maxTensionLb
      ? `${formatTension(model.tensionMinLb, unit)}–${formatTension(model.maxTensionLb, unit)}${unit}`
      : null

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-start gap-3 rounded-md border border-border bg-card p-3">
        {model.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={model.imageUrl}
            alt=""
            className="size-12 shrink-0 rounded border border-border bg-background object-contain"
          />
        )}
        <div className="min-w-0">
          <p className="font-medium">
            {model.brand} {model.model}
          </p>
          <p className="tabular font-mono text-xs text-muted-foreground">
            {customer.name} · {racket.shortCode} · {model.pattern.mains}×
            {model.pattern.crosses}
            {model.patternKnown === false ? '?' : ''}
          </p>
          {range && (
            <p className="tabular mt-0.5 font-mono text-[11px] text-muted-foreground">
              Rated {range}
              {model.ra ? ` · RA ${model.ra}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* The fast path. Full width, thumb height, unmissable. */}
      {previous && !expanded && (
        <>
          <button
            type="button"
            onClick={() =>
              commit(
                previous.tensionMainsLb,
                previous.tensionCrossesLb,
                previous.stringId,
                previous.gaugeMm,
              )
            }
            className="flex w-full flex-col gap-1 rounded-lg bg-primary px-4 py-4 text-left text-primary-foreground transition-transform active:scale-[0.99]"
          >
            <span className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-wide">
              <Zap className="size-5" />
              Same again
            </span>
            <span className="tabular font-mono text-sm">
              {describeSetup(previous)} · {formatTension(previous.tensionMainsLb, unit)}/
              {formatTension(previous.tensionCrossesLb, unit)}
              {unit}
            </span>
          </button>

          {previous.because.length > 0 && (
            <p className="text-xs text-muted-foreground">{previous.because[0]}</p>
          )}

          {suggestion.tensionMainsLb !== previous.tensionMainsLb && (
            <div className="rounded-md border border-border bg-card p-3">
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Suggested change
              </p>
              <p className="tabular mt-1 text-sm">
                {formatTension(suggestion.tensionMainsLb, unit)}/
                {formatTension(suggestion.tensionCrossesLb, unit)}
                {unit}
              </p>
              {suggestion.because.map((b) => (
                <p key={b} className="mt-1 text-xs text-muted-foreground">
                  {b}
                </p>
              ))}
              <Button
                variant="secondary"
                className="mt-3 h-10 w-full"
                onClick={() =>
                  commit(
                    suggestion.tensionMainsLb,
                    suggestion.tensionCrossesLb,
                    suggestion.stringId,
                    suggestion.gaugeMm,
                  )
                }
              >
                Use suggested
              </Button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="self-start text-sm font-medium text-muted-foreground underline underline-offset-4"
          >
            Change something
          </button>
        </>
      )}

      {expanded && (
        <>
          {!previous && suggestion.because.length > 0 && (
            <p className="text-xs text-muted-foreground">{suggestion.because[0]}</p>
          )}

          <TensionPair
            mainsLb={tension.mainsLb}
            crossesLb={tension.crossesLb}
            unit={unit}
            linked={linked}
            onChange={setTension}
            onLinkedChange={setLinked}
            warning={guardrail?.message}
          />

          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              String
            </span>
            <div className="flex flex-wrap gap-2">
              {strings
                .filter((s) =>
                  model.sport === 'badminton'
                    ? s.family === 'badminton'
                    : s.family !== 'badminton',
                )
                .map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setStringId(s.id)
                      if (!s.gaugesMm.includes(gaugeMm)) setGaugeMm(s.gaugesMm[0])
                    }}
                    className={cn(
                      'rounded-md border px-3 py-2 text-sm transition-colors',
                      s.id === stringId
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card',
                    )}
                  >
                    {s.brand} {s.name}
                  </button>
                ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Gauge
            </span>
            <div className="flex flex-wrap gap-2">
              {selected.gaugesMm.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGaugeMm(g)}
                  className={cn(
                    'tabular rounded-md border px-3 py-2 font-mono text-sm transition-colors',
                    g === gaugeMm
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card',
                  )}
                >
                  {g.toFixed(2)}mm
                </button>
              ))}
            </div>
          </div>

          <Button
            className="h-14 w-full font-display text-lg font-bold uppercase tracking-wide"
            onClick={() => commit(tension.mainsLb, tension.crossesLb, stringId, gaugeMm)}
          >
            <Check className="size-5" />
            Add to queue · {formatMoney(priceCents, BRAND.currencySymbol)}
          </Button>
        </>
      )}
    </div>
  )
}
