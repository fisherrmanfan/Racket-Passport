import { StringBedMeter } from '@/components/domain/string-bed-meter'
import { stateFor } from '@/lib/string-life'

/** Dev harness — every size against every state. Not linked from the app. */
export default function Page() {
  const cases: Array<{ percent: number; snapped?: boolean }> = [
    { percent: 100 },
    { percent: 72 },
    { percent: 40 },
    { percent: 10 },
    { percent: 0, snapped: true },
  ]

  return (
    <main className="min-h-svh bg-background p-8">
      <h1 className="mb-8 font-display text-2xl font-bold uppercase">Meter states</h1>
      {[24, 36, 96, 240].map((size) => (
        <section key={size} className="mb-12">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {size}px
          </h2>
          <div className="flex flex-wrap items-end gap-8 text-foreground">
            {cases.map((c) => (
              <div key={`${size}-${c.percent}`} className="flex flex-col items-center gap-2">
                <StringBedMeter
                  pattern={{ mains: 16, crosses: 19 }}
                  percent={c.percent}
                  state={stateFor(c.percent, c.snapped)}
                  size={size}
                  label={`${c.percent} percent`}
                />
                <span className="tabular font-mono text-xs text-muted-foreground">
                  {c.snapped ? 'snapped' : `${c.percent}%`}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
