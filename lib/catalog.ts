import type { RacketModel, Sport, StringPattern } from './types'

/**
 * The shared racket catalogue: 2,700-odd frames from the racket_database_etl
 * pipeline, exposed through the `racket_catalog` view.
 *
 * BACKEND doc §2.2: this is the *model*, not the physical racket. A player's
 * Pure Aero is a `RacketInstance` that points at one of these.
 *
 * Everything in this file is pure and isomorphic — the SQL lives in
 * `catalog-db.ts` (server-only), the fetching in `catalog-client.ts`.
 */

export interface CatalogRacket {
  /** `racket_catalog.racket_id` — stable across ETL runs. */
  catalogId: number
  /** Manufacturer pcode, e.g. `PAVS`. */
  sourceId: string | null
  brand: string
  /** Name with the brand prefix stripped: "Pure Aero VS - 2016". */
  model: string
  /** As stored: "Babolat Pure Aero VS - 2016". */
  fullName: string
  sport: Sport
  headSizeSqIn: number | null
  lengthIn: number | null
  weightG: number | null
  weightOz: number | null
  balancePts: number | null
  /** "HL" head-light, "HH" head-heavy, "EB" even balance. */
  balanceType: string | null
  balanceMm: number | null
  swingweight: number | null
  /** RA. Firm frames pull tension recommendations down. */
  ra: number | null
  beamWidthMm: number | null
  powerLevel: string | null
  composition: string | null
  pattern: StringPattern | null
  /** Manufacturer's stated range, in lb. Drives the advisory guardrail. */
  tensionMinLb: number | null
  tensionMaxLb: number | null
  thumbUrl: string | null
  fullUrl: string | null
  /** Trigram/word-match score, 0–1. Present on search results only. */
  score?: number
}

/* ── Parsers — the view stores these as text, mostly from scraped specs ── */

/** "16x19" → { mains: 16, crosses: 19 }. "0x0" and junk return null. */
export function parsePattern(raw: string | null | undefined): StringPattern | null {
  if (!raw) return null
  const m = /^\s*(\d{1,2})\s*[x×]\s*(\d{1,2})\s*$/i.exec(raw)
  if (!m) return null
  const mains = Number(m[1])
  const crosses = Number(m[2])
  if (!mains || !crosses) return null
  return { mains, crosses }
}

/** "50-59" → [50, 59]. "55 lbs" → [55, 55]. Values are lb. */
export function parseTensionRange(
  raw: string | null | undefined,
): [number | null, number | null] {
  if (!raw) return [null, null]
  const nums = raw.match(/\d+(?:\.\d+)?/g)
  if (!nums?.length) return [null, null]
  const min = Number(nums[0])
  const max = nums.length > 1 ? Number(nums[1]) : min
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [null, null]
  return [min, max]
}

/** Catalogue names repeat the brand; the UI shows brand and model separately. */
export function stripBrand(fullName: string, brand: string): string {
  const trimmed = fullName.trim()
  if (brand && trimmed.toLowerCase().startsWith(brand.toLowerCase())) {
    return trimmed.slice(brand.length).replace(/^[\s·-]+/, '') || trimmed
  }
  return trimmed
}

/* ── Presentation ── */

/**
 * The spec strip inside a combobox option row (FRONTEND doc §5: "shows key
 * specs in the option row"). Four numbers, the ones a stringer actually uses
 * to tell two similar frames apart.
 */
export function specSummary(racket: CatalogRacket): string {
  const parts: string[] = []
  if (racket.headSizeSqIn) parts.push(`${racket.headSizeSqIn} sq in`)
  if (racket.weightG) parts.push(`${Math.round(racket.weightG)}g`)
  if (racket.pattern) parts.push(`${racket.pattern.mains}×${racket.pattern.crosses}`)
  if (racket.ra) parts.push(`RA ${racket.ra}`)
  return parts.join(' · ')
}

export function tensionRangeLabel(racket: CatalogRacket): string | null {
  const { tensionMinLb: min, tensionMaxLb: max } = racket
  if (min === null && max === null) return null
  if (min !== null && max !== null && min !== max) return `${min}–${max} lb`
  return `${min ?? max} lb`
}

/* ── Bridge to the app's domain model ── */

/**
 * A catalogue row is missing things the console assumes are present — the
 * string bed meter needs a pattern, the recommender needs an RA. Fall back to
 * the most common frame in the catalogue (16×19) rather than refusing to draw,
 * and to a mid RA rather than nudging tension on a guess.
 */
export const FALLBACK_PATTERN: StringPattern = { mains: 16, crosses: 19 }
const FALLBACK_RA = 65

export function toRacketModel(racket: CatalogRacket): RacketModel {
  return {
    id: catalogModelId(racket.catalogId),
    catalogId: racket.catalogId,
    brand: racket.brand,
    model: racket.model,
    sport: racket.sport,
    headSizeSqIn: racket.headSizeSqIn ?? 0,
    pattern: racket.pattern ?? FALLBACK_PATTERN,
    patternKnown: racket.pattern !== null,
    ra: racket.ra ?? FALLBACK_RA,
    tensionMinLb: racket.tensionMinLb ?? undefined,
    maxTensionLb: racket.tensionMaxLb ?? undefined,
    weightG: racket.weightG ?? undefined,
    swingweight: racket.swingweight ?? undefined,
    balancePts: racket.balancePts ?? undefined,
    balanceType: racket.balanceType ?? undefined,
    imageUrl: racket.thumbUrl ?? racket.fullUrl ?? undefined,
  }
}

/** Namespaced so catalogue-backed models never collide with the seed fixtures. */
export function catalogModelId(catalogId: number): string {
  return `cat-${catalogId}`
}
