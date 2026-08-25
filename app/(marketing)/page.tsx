import Link from 'next/link'
import { ArrowRight, Store, User } from 'lucide-react'
import { StringBedMeter } from '@/components/domain/string-bed-meter'
import { BRAND } from '@/lib/brand'

/**
 * The front door. Until there's real auth, this is also where the two
 * surfaces are chosen by hand — a stringer and a player want genuinely
 * different products (FRONTEND doc §1.1), and both need to be reachable.
 *
 * Paper palette, not the bench: the console's dark surface is scoped to
 * `.console` and belongs at the bench, not on a page a stranger lands on.
 */
export default function Page() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center px-6 py-16">
        <header className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="shrink-0 text-ink-500">
            <StringBedMeter
              pattern={{ mains: 16, crosses: 19 }}
              percent={68}
              state="fresh"
              size={96}
              label="A string bed at 68 percent life"
            />
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {BRAND.name}
            </p>
            <h1 className="mt-1 font-display text-4xl font-bold uppercase leading-none tracking-wide sm:text-5xl">
              String jobs,
              <br />
              logged in 20 seconds
            </h1>
            <p className="mt-4 max-w-md text-pretty text-muted-foreground">
              A bench tool for stringers. Log a job, print a label, and give
              every racket a passport its owner can scan.
            </p>
          </div>
        </header>

        <nav aria-label="Choose your surface" className="mt-12 grid gap-3 sm:grid-cols-2">
          <Door
            href="/app"
            icon={<Store className="size-5" />}
            eyebrow="For the stringer"
            title="Bench console"
            body="Today's queue, the 20-second job, and 2,700 frames of catalogue behind the search."
          />
          <Door
            href="/my"
            icon={<User className="size-5" />}
            eyebrow="For the player"
            title="My rackets"
            body="What's in your frame, how much life the strings have left, and when it's worth restringing."
          />
        </nav>

        <p className="mt-10 text-xs text-muted-foreground">
          Prototype. Pick a surface — there&apos;s no sign-in yet, and both are
          seeded with example data.
        </p>
      </div>
    </main>
  )
}

function Door({
  href,
  icon,
  eyebrow,
  title,
  body,
}: {
  href: string
  icon: React.ReactNode
  eyebrow: string
  title: string
  body: string
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-fluoro-d"
    >
      <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {icon}
        {eyebrow}
      </span>
      <span className="mt-3 flex items-center gap-2 font-display text-xl font-bold uppercase tracking-wide">
        {title}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
      <span className="mt-2 text-sm text-pretty text-muted-foreground">{body}</span>
    </Link>
  )
}
