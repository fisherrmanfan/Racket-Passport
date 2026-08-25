# Progress

What's actually wired up versus still a fixture or missing, so this doesn't
need re-deriving from the code each time. Kept in sync by hand — update it in
the same PR as whatever it describes goes stale.

## Done

- **Catalogue is live.** 2,723 frames in `racket_catalog`, typo-tolerant search
  (word-match then trigram fallback) via [lib/catalog-db.ts](lib/catalog-db.ts).
  `/api/v1/catalog/rackets`, `/api/v1/catalog/rackets/:id`, `/api/v1/health`.
- **Racket specs flow into the console for real** — string bed meter pattern,
  tension guardrail range, and the recommender's fallback anchor all come from
  the catalogue, not hardcoded numbers.
- **Racket photos** — pulled from `racket_catalog`'s Supabase Storage columns
  (`thumb_url` → `source_image_url` fallback), shown on match cards.
- **Three surfaces, one codebase**: `/` (marketing home + surface picker),
  `/app` (stringer console, tablet-first), `/my` (player view, phone-first).
  Reachable from the header at every width.
- **Legacy Express API ported** to Next.js route handlers under `app/api/v1/`
  (no separate API service, per BACKEND §1); the original Express server and
  its test UI are kept in `legacy/` for reference, not run in production.
- **Units**: tensions always stored in lb; kg is a display-only toggle
  (FRONTEND §12).

## Still fixtures (real shape, fake data)

- **Jobs, customers, rackets-in-progress, and the string list** are in-memory
  ([components/console/job-store.tsx](components/console/job-store.tsx)),
  seeded from [lib/mock-data.ts](lib/mock-data.ts), reset on reload. Shape
  mirrors what a server-action layer would expose — wiring it is a swap of
  calls, not a rewrite.
- **`lib/recommend.ts`** — the recommendation engine is a mock nudge on the
  previous job. Real engine drops into `recommend()`; nothing downstream
  reads its internals (BACKEND §7.0).
- **`/my` shows one hardcoded player** (`PLAYER_ID` in
  `components/player/my-rackets.tsx`) because there's no session. Its
  "Request restring" button doesn't submit anywhere yet.

## Not built yet

- **No authentication.** No `/login`, no session. Spec (BACKEND §5) calls for
  passwordless phone OTP or a magic link via Supabase Auth or Clerk — needs a
  provider account before it can be wired, so it's intentionally deferred.
- **Public passport page** (`/r/[shortCode]`) — the QR destination and the
  wireframe's top-of-funnel.
- **`/find-your-setup`** — the recommendation wizard.
- **QR scanning, label printing, the due-this-week review queue.**
- **No automated tests.** `package.json` has no `test` script.

## Notes for whoever picks this up

- Two deliberate seams to swap in real implementations without touching
  callers: `lib/recommend.ts` (recommendation engine) and
  `lib/catalog-client.ts` (the only file that builds a catalogue URL).
- `info/files.zip` (`MASTER`/`FRONTEND`/`BACKEND` docs) is the still-live spec
  — section numbers in code comments (`FRONTEND doc §X`, `BACKEND doc §X`)
  point back into it.
