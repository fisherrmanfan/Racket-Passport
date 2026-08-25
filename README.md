# Racket Passport

A stringer's bench console over the shared racket catalogue: log a job in about
twenty seconds, and give every racket a passport its owner can scan.

Three sources were merged into this repo:

| Source | What it was | Where it went |
|---|---|---|
| `info/files.zip` | The three-part wireframe (`MASTER`, `FRONTEND`, `BACKEND`) | Reference. Section numbers are cited in code comments. Kept — still the source of truth. |
| `info/racket-passport.zip` | Next.js console prototype against fixtures | Fully merged into `app/`, `components/`, `lib/`; the archive itself was removed once nothing referenced it. |
| This repo (previously) | Express read-API over `racket_catalog` with trigram autocomplete | Ported to route handlers under `app/api/v1/`; original kept in `legacy/` |

The wireframe's BACKEND §1 is explicit that there is **no separate API
service** — the engines are modules in one codebase — so the Express endpoints
became Next.js route handlers rather than staying a second process.

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill in `DATABASE_URL` (the Supabase pooler
URL for the `racket_database_etl` database), then:

```bash
npm run migrate
```

That's a one-time step: it enables `pg_trgm` and builds the GIN index behind
autocomplete. Then:

```bash
npm run dev
```

## What's wired up

**The catalogue is live.** 2,723 frames, searched typo-tolerantly, feeding real
specs into the console:

- `/api/v1/catalog/rackets?q=&sport=&limit=` — typeahead
- `/api/v1/catalog/rackets/:id` — by `racket_id` or manufacturer pcode
- `/api/v1/health` — app up *and* catalogue reachable

Search runs two passes ([lib/catalog-db.ts](lib/catalog-db.ts)). First a
word-match: every typed word must appear in the name, in any order, shortest
name first — so `aero 98` finds the Pure Aero 98 regardless of word order, and
exact hits always outrank fuzzy ones. If that leaves slots free, a trigram pass
fills them, which is what catches `ezoen 100` → Yonex EZONE 100 and `pure aro` →
Babolat Pure Aero. Nonsense still returns nothing.

The legacy API split these across `/match` and `/autocomplete`; a combobox needs
both behaviours from one call.

**Picking a frame carries its real specs through the app.** The string bed meter
draws the catalogue's actual pattern (16×18, 18×20), the tension guardrail fires
on the manufacturer's stated range rather than a hardcoded ceiling, and with no
job history the recommender anchors to the middle of that range instead of a
guess.

## Layout

```
app/
  (marketing)/page.tsx          /     — front door, picks a surface
  (stringer)/app/page.tsx       /app  — the bench console
  (player)/my/page.tsx          /my   — the player's rackets
  api/v1/catalog/rackets/       Catalogue endpoints (BACKEND §6)
  api/v1/health/
  dev/meter/                    String bed meter harness, every size × state
components/
  console/                      Today screen, job rows, the new-job sheet
  player/                       My rackets
  shell/                        Console frame, surface switcher
  domain/                       StringBedMeter, TensionPair, RacketCombobox
  ui/                           shadcn primitives
lib/
  catalog.ts                    Catalogue types + parsers (isomorphic)
  catalog-db.ts                 SQL (server-only)
  catalog-client.ts             Typed fetch client
  db.ts                         pg pool (server-only)
  recommend.ts                  SEAM — swap the mock for the real engine here
  string-life.ts                Wear model behind the meter
  units.ts                      lb⇄kg, gauge. Pure.
  short-code.ts                 Crockford base32 QR codes (BACKEND §11.1)
  mock-data.ts                  Fixtures: strings, customers, seed jobs
legacy/                         The original Express API + its test UI
migrations/                     pg_trgm + autocomplete index
info/                           files.zip — the wireframe spec, cited by section number
PROGRESS.md                     What's wired up vs. what's still open
```

## Surfaces

The wireframe treats these as three different products sharing a codebase
(FRONTEND §1.1), and they're styled that way — the dark bench palette is scoped
to `.console` so the player and public surfaces stay on paper.

| Route | Who | Shape |
|---|---|---|
| `/` | Anyone | Marketing home — hero, the string bed meter's four states, what each side gets, pricing. Until there's auth, also where you pick a surface. |
| `/app` | Stringer | Dark, dense, tablet-first. One column on a phone, two on an iPad, three on a laptop. |
| `/my` | Player | Paper, calm, phone-first. Stays a single readable column on desktop — a bag holds a handful of rackets, not a dashboard. |

Both surfaces are reachable from the header at every width, and from `/`.

## What is still fixtures

The catalogue is real. Jobs, customers, rackets and the string list are
in-memory ([components/console/job-store.tsx](components/console/job-store.tsx)),
seeded from `lib/mock-data.ts` and reset on reload. The store's shape mirrors
what a server-action layer would expose, so wiring the job tables is a swap of
those calls rather than a rewrite.

Two deliberate seams, both documented in the wireframe:

- `lib/recommend.ts` — the real recommendation engine replaces the body of
  `recommend()`. Nothing downstream reads its internals (BACKEND §7.0).
- `lib/catalog-client.ts` — the only file that builds a catalogue URL.

## Units

**Tensions are stored in lb, always**; the kg toggle is display-only
(FRONTEND §12). Note that the wireframe quotes tensions in kg throughout —
Singapore convention — so a job shown as `24/22` in the wireframe is stored
here as `53/48.5`. The seed fixtures were converted accordingly; without that,
every seeded tennis job trips the catalogue's real lb guardrail.

## Not built yet

**There is no authentication.** `/login` does not exist, and neither does any
session. The spec (BACKEND §5) says not to build this yourself — it wants
passwordless phone OTP or a magic link via Supabase Auth or Clerk — so it needs
a provider account before it can be wired.

The public passport page (`/r/[shortCode]`) — the QR destination, and the
wireframe's top-of-funnel — is not built yet, nor are `/find-your-setup`, the
recommendation wizard, QR scanning, label printing, or the due-this-week
review queue.

`/my` shows one hardcoded player (`PLAYER_ID` in `components/player/my-rackets.tsx`)
because there's no session yet, and its "Request restring" button doesn't
submit anywhere.
