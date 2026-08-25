import Link from 'next/link'
import { ArrowRight, Bell, QrCode, Search, Store, User, Zap } from 'lucide-react'
import { StringBedMeter } from '@/components/domain/string-bed-meter'
import { BRAND } from '@/lib/brand'
import type { MeterState } from '@/lib/types'

/**
 * Marketing home (FRONTEND doc §3).
 *
 * Grounded in the bench, not in SaaS-landing-page defaults: paper, one fluoro
 * accent, condensed display type, mono for every number. §2.1 rules out the
 * cream / high-contrast-serif / terracotta look explicitly, so the contrast
 * here comes from a dark bench section in the middle rather than from a warm
 * palette.
 *
 * The string bed meter carries the page, because it carries the product
 * (§2.4) — the whole pitch is that invisible, gradual decay becomes visible.
 */

export default function Page() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <MeterShowcase />
        <ForStringers />
        <ForPlayers />
        <Pricing />
      </main>
      <SiteFooter />
    </div>
  )
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-5 md:px-8">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="whitespace-nowrap font-display text-base font-bold uppercase tracking-wide">
            {BRAND.name}
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1">
          <Link
            href="/my"
            className="hidden h-10 items-center whitespace-nowrap rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            My rackets
          </Link>
          <Link
            href="/app"
            className="flex h-10 items-center whitespace-nowrap rounded-md bg-primary px-4 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-transform active:scale-[0.98]"
          >
            Open console
          </Link>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-5 pt-16 pb-20 md:px-8 md:pt-24 md:pb-28">
      <div className="grid items-center gap-12 md:grid-cols-[1fr_auto]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            For stringers and the people they string for
          </p>
          <h1 className="mt-4 text-balance font-display text-4xl font-bold uppercase leading-[0.95] tracking-wide sm:text-5xl lg:text-6xl">
            Know what to string.
            <br />
            Know when it&apos;s dead.
          </h1>
          <p className="mt-6 max-w-lg text-pretty text-lg text-muted-foreground">
            A bench tool for stringers, and a passport for every racket they
            string. Log a job in twenty seconds. Give the owner a page that
            shows exactly what&apos;s in their frame and how much life is left
            in it.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/app"
              className="flex h-13 items-center gap-2 rounded-lg bg-primary px-6 font-display text-lg font-bold uppercase tracking-wide text-primary-foreground transition-transform active:scale-[0.99]"
            >
              <Store className="size-5" />
              I&apos;m a stringer
            </Link>
            <Link
              href="/my"
              className="flex h-13 items-center gap-2 rounded-lg border border-border px-6 font-display text-lg font-bold uppercase tracking-wide transition-colors hover:border-fluoro-d"
            >
              <User className="size-5" />
              I&apos;m a player
            </Link>
          </div>
        </div>

        <div className="justify-self-center text-ink-500 md:justify-self-end">
          <StringBedMeter
            pattern={{ mains: 16, crosses: 19 }}
            percent={62}
            state="fresh"
            size={240}
            label="A string bed drawn at 62 percent life"
          />
        </div>
      </div>
    </section>
  )
}

/** The signature element, shown doing the one thing it exists to do (§2.4). */
function MeterShowcase() {
  const states: Array<{ percent: number; state: MeterState; title: string; body: string }> = [
    {
      percent: 100,
      state: 'fresh',
      title: 'Fresh',
      body: 'Taut, even, holding tension. Just off the machine.',
    },
    {
      percent: 45,
      state: 'fading',
      title: 'Fading',
      body: 'Still playable, but the spacing is going and so is the bite.',
    },
    {
      percent: 8,
      state: 'dead',
      title: 'Dead',
      body: 'Visibly slack. This is where most people are still playing.',
    },
    {
      percent: 0,
      state: 'snapped',
      title: 'Snapped',
      body: 'It broke. At least this one is obvious.',
    },
  ]

  return (
    <section className="bg-ink-900 py-20 text-paper md:py-28">
      <div className="mx-auto max-w-5xl px-5 md:px-8">
        <h2 className="max-w-2xl text-balance font-display text-3xl font-bold uppercase leading-tight tracking-wide md:text-4xl">
          Strings die slowly, which is exactly why people leave it too late
        </h2>
        <p className="mt-4 max-w-xl text-pretty text-ink-300">
          A tension loss of a few pounds a week is invisible. So we draw it —
          at the racket&apos;s real pattern, going slack as the strings go.
          It&apos;s the same graphic on the bench, in the player&apos;s pocket,
          and on the sticker they scan.
        </p>

        <ul className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {states.map((s) => (
            <li key={s.title} className="flex flex-col items-start">
              <div className="text-ink-500">
                <StringBedMeter
                  pattern={{ mains: 16, crosses: 19 }}
                  percent={s.percent}
                  state={s.state}
                  size={140}
                  label={`${s.title}: a string bed at ${s.percent} percent life`}
                />
              </div>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-xl font-bold uppercase tracking-wide">
                  {s.title}
                </span>
                {s.state !== 'snapped' && (
                  <span className="tabular font-mono text-xs text-ink-300">
                    {s.percent}%
                  </span>
                )}
              </p>
              <p className="mt-1 text-pretty text-sm text-ink-300">{s.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ForStringers() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-20 md:px-8 md:py-28">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        For the stringer
      </p>
      <h2 className="mt-3 max-w-2xl text-balance font-display text-3xl font-bold uppercase leading-tight tracking-wide md:text-4xl">
        Most jobs are repeats. The tool should know that.
      </h2>

      <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
        <Feature
          icon={<Zap className="size-5" />}
          title="Same again, one tap"
          body="Pull up a regular and their last setup is right there — string, gauge, tensions, and how it played. Most jobs never need more than that."
        />
        <Feature
          icon={<Search className="size-5" />}
          title="2,723 frames, typo-tolerant"
          body="Search the catalogue the way it's written on the frame. Word order doesn't matter and spelling doesn't either — “aero 98” and “ezoen 100” both land. Specs come with it, so you never type a head size again."
        />
        <Feature
          icon={<QrCode className="size-5" />}
          title="A sticker that outlives the job"
          body="Every racket gets a permanent short code and a QR label. Scan it at the bench to relog in seconds, or let the owner scan it to see what's in their frame."
        />
        <Feature
          icon={<Bell className="size-5" />}
          title="Reminders that bring people back"
          body="Restrings get predicted from how much the player actually plays, not from a fixed calendar. You review the week's list and send, or let it send itself once you trust it."
        />
      </ul>

      <Link
        href="/app"
        className="mt-12 inline-flex items-center gap-2 font-display text-lg font-bold uppercase tracking-wide underline decoration-fluoro-d decoration-2 underline-offset-8"
      >
        Open the console
        <ArrowRight className="size-4" />
      </Link>
    </section>
  )
}

function ForPlayers() {
  return (
    <section className="border-y border-border bg-secondary/50">
      <div className="mx-auto max-w-5xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              For the player
            </p>
            <h2 className="mt-3 text-balance font-display text-3xl font-bold uppercase leading-tight tracking-wide md:text-4xl">
              Free. Forever. No asterisk.
            </h2>
            <p className="mt-5 text-pretty text-muted-foreground">
              Your rackets, what&apos;s strung in them, and how much life is
              left — kept in one place even when you switch stringers or get
              strung at a tournament. Your history is yours.
            </p>
            <ul className="mt-6 flex flex-col gap-3 text-sm">
              {[
                'See string life at a glance, per racket',
                'A nudge when a restring is actually due — not on a fixed schedule',
                'Pause every reminder in one tap, from anywhere',
                'Ask for a restring without a phone call',
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-fluoro-d"
                  />
                  <span className="text-pretty text-muted-foreground">{line}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/my"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg border border-border bg-card px-5 font-display text-base font-bold uppercase tracking-wide transition-colors hover:border-fluoro-d"
            >
              See a player&apos;s rackets
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="justify-self-center text-ink-300">
            <StringBedMeter
              pattern={{ mains: 18, crosses: 20 }}
              percent={18}
              state="dead"
              size={200}
              label="A player's string bed at 18 percent life, nearly due"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-20 md:px-8 md:py-28">
      <h2 className="max-w-2xl text-balance font-display text-3xl font-bold uppercase leading-tight tracking-wide md:text-4xl">
        One recovered customer pays for the year
      </h2>
      {/* §12.3, verbatim — the number makes the argument. */}
      <p className="mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
        A restring is {BRAND.currencySymbol}35. If reminders bring back{' '}
        <em className="not-italic text-foreground">one</em> customer you&apos;d
        have lost, the year is paid for twice over. Everything else is free.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <Tier
          name="Player"
          price="Free"
          note="Always"
          lines={['Every racket', 'Full history', 'Reminders you control']}
        />
        <Tier
          name="Solo"
          price={`${BRAND.currencySymbol}12`}
          note="per month"
          featured
          lines={['Unlimited jobs', 'Automatic reminders', 'Branded QR labels']}
        />
        <Tier
          name="Shop"
          price={`${BRAND.currencySymbol}39`}
          note="per month"
          lines={['Up to 5 stringers', 'Inventory + invoicing', 'Per-stringer analytics']}
        />
      </div>

      <p className="mt-6 font-mono text-xs text-muted-foreground">
        Indicative. Free tier is capped by volume, never by feature.
      </p>
    </section>
  )
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <li>
      <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-foreground">
        {icon}
      </span>
      <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-wide">
        {title}
      </h3>
      <p className="mt-2 text-pretty text-sm text-muted-foreground">{body}</p>
    </li>
  )
}

function Tier({
  name,
  price,
  note,
  lines,
  featured,
}: {
  name: string
  price: string
  note: string
  lines: string[]
  featured?: boolean
}) {
  return (
    <div
      className={`flex flex-col rounded-lg border bg-card p-5 ${
        featured ? 'border-fluoro-d' : 'border-border'
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {name}
      </p>
      <p className="tabular mt-2 flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold">{price}</span>
        <span className="font-mono text-xs text-muted-foreground">{note}</span>
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {lines.map((line) => (
          <li key={line} className="flex gap-2 text-sm text-muted-foreground">
            <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-fluoro-d" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-10 md:flex-row md:items-center md:px-8">
        <p className="font-display text-sm font-bold uppercase tracking-wide">
          {BRAND.name}
        </p>
        <p className="text-xs text-muted-foreground md:ml-auto">
          Prototype — no sign-in yet, and both surfaces run on example data.
          The racket catalogue is real.
        </p>
      </div>
    </footer>
  )
}
