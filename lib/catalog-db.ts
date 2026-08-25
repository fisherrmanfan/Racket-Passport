import 'server-only'
import { pool } from './db'
import {
  parsePattern,
  parseTensionRange,
  stripBrand,
  type CatalogRacket,
} from './catalog'
import type { Sport } from './types'

/**
 * Catalogue queries. Ported from the standalone Express API (now under
 * `legacy/`) into the one-codebase architecture of BACKEND doc §1.
 *
 * The `racket_catalog` view already excludes junk rows, so both search paths
 * read it directly and inherit that filter.
 */

const SELECT = `
  SELECT racket_id, source_id, manufacturer, name, head_size, length,
         weight_oz, weight_g, balance_pts, balance_type, balance_mm,
         swingweight, stiffness, beam_width, power_level, string_pattern,
         tension, composition_clean, thumb_url, full_url, source_image_url
  FROM racket_catalog`

interface CatalogRow {
  racket_id: number
  source_id: string | null
  manufacturer: string | null
  name: string
  head_size: string | null
  length: string | null
  weight_oz: string | null
  weight_g: string | null
  balance_pts: string | null
  balance_type: string | null
  balance_mm: string | null
  swingweight: number | null
  stiffness: number | null
  beam_width: string | null
  power_level: string | null
  string_pattern: string | null
  tension: string | null
  composition_clean: string | null
  thumb_url: string | null
  full_url: string | null
  source_image_url: string | null
  score?: string | number | null
}

/** Postgres numerics arrive as strings; `null` must survive as `null`, not 0. */
function num(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toCatalogRacket(row: CatalogRow): CatalogRacket {
  const brand = row.manufacturer?.trim() ?? ''
  const [tensionMinLb, tensionMaxLb] = parseTensionRange(row.tension)

  return {
    catalogId: row.racket_id,
    sourceId: row.source_id,
    brand,
    model: stripBrand(row.name, brand),
    fullName: row.name,
    // The catalogue is a tennis database. BACKEND doc §2.3 keeps the field so
    // badminton needs no migration when its data arrives.
    sport: 'tennis',
    headSizeSqIn: num(row.head_size),
    lengthIn: num(row.length),
    weightG: num(row.weight_g),
    weightOz: num(row.weight_oz),
    balancePts: num(row.balance_pts),
    balanceType: row.balance_type,
    balanceMm: num(row.balance_mm),
    swingweight: num(row.swingweight),
    ra: num(row.stiffness),
    beamWidthMm: num(row.beam_width),
    powerLevel: row.power_level,
    composition: row.composition_clean,
    pattern: parsePattern(row.string_pattern),
    tensionMinLb,
    tensionMaxLb,
    thumbUrl: row.thumb_url,
    fullUrl: row.full_url ?? row.source_image_url,
    score: num(row.score ?? null) ?? undefined,
  }
}

export interface SearchOptions {
  limit?: number
  sport?: Sport
}

/**
 * Typeahead over the catalogue, in two passes.
 *
 * 1. **Word match** — every typed word must appear in the name, in any order,
 *    shortest name first. "aero 98" finds the Pure Aero 98 whatever order the
 *    words came in, and it's exact, so it ranks above anything fuzzy.
 * 2. **Trigram top-up** — `word_similarity` over the GIN index catches the
 *    typos pass 1 can't ("pure aro", "ezoen 100"), and fills the remaining
 *    slots.
 *
 * The legacy API split these across `/match` and `/autocomplete`; a combobox
 * needs both behaviours from one call, so they're merged here with pass 1
 * always winning ties.
 */
export async function searchCatalog(
  q: string,
  { limit = 10, sport = 'tennis' }: SearchOptions = {},
): Promise<CatalogRacket[]> {
  const query = q.trim()
  if (!query) return []
  // The catalogue holds tennis frames only (BACKEND doc §10: badminton is
  // built by contribution). Answering an empty list beats answering wrongly.
  if (sport !== 'tennis') return []

  const capped = Math.min(Math.max(limit, 1), 25)
  const words = query.split(/\s+/).filter(Boolean).slice(0, 8)

  const params: unknown[] = []
  const clauses = words.map((w) => {
    params.push(`%${w}%`)
    return `name ILIKE $${params.length}`
  })
  params.push(capped)

  const exact = await pool.query<CatalogRow>(
    `${SELECT}
     WHERE ${clauses.join(' AND ')}
     ORDER BY length(name) ASC, name ASC
     LIMIT $${params.length}`,
    params,
  )

  const rackets = exact.rows.map(toCatalogRacket)
  if (rackets.length >= capped) return rackets

  const seen = new Set(rackets.map((r) => r.catalogId))
  const fuzzy = await fuzzySearch(query, [...seen], capped - rackets.length)
  return [...rackets, ...fuzzy]
}

/**
 * pg_trgm's default word-similarity threshold of 0.6 is tuned for whole-name
 * matching and rejects most single-character typos — "ezoen 100" against
 * "Yonex EZONE 100" scores 0.54, "pure aro" against "Pure Aero" 0.67.
 */
const WORD_SIMILARITY_THRESHOLD = 0.45

/**
 * The threshold is applied as an ordinary predicate rather than through
 * `pg_trgm.word_similarity_threshold` and the `<%` operator, which would use
 * the GIN index. Two reasons: the GUC only takes effect via SET, which is one
 * extra round trip per search (or unreliable at session scope behind
 * Supabase's transaction pooler), and at 2.7k rows the scan costs less than
 * the round trip does. Revisit if the catalogue grows past ~50k rows.
 */
async function fuzzySearch(
  query: string,
  exclude: number[],
  limit: number,
): Promise<CatalogRacket[]> {
  if (limit <= 0) return []

  const { rows } = await pool.query<CatalogRow>(
    `${SELECT}
     WHERE word_similarity($1, name) >= $2
       AND NOT (racket_id = ANY($3::int[]))
     ORDER BY word_similarity($1, name) DESC, length(name) ASC, name ASC
     LIMIT $4`,
    [query, WORD_SIMILARITY_THRESHOLD, exclude, limit],
  )
  return rows.map(toCatalogRacket)
}

/** By numeric `racket_id` or manufacturer `source_id` (pcode). */
export async function getCatalogRacket(id: string): Promise<CatalogRacket | null> {
  const numeric = /^[0-9]+$/.test(id)
  const { rows } = await pool.query<CatalogRow>(
    `${SELECT} WHERE ${numeric ? 'racket_id = $1::int' : 'source_id = $1'} LIMIT 1`,
    [id],
  )
  return rows.length ? toCatalogRacket(rows[0]) : null
}

/** Liveness for `/api/v1/health` — cheap, but a real round trip. */
export async function catalogCount(): Promise<number> {
  const { rows } = await pool.query<{ n: number }>(
    'SELECT count(*)::int AS n FROM racket_catalog',
  )
  return rows[0]?.n ?? 0
}
