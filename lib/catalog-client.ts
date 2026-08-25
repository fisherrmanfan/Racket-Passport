import type { CatalogRacket } from './catalog'
import type { Sport } from './types'

/**
 * Typed client for the catalogue endpoints. The UI never builds a URL or
 * touches `fetch` directly — when the generated OpenAPI client lands
 * (FRONTEND doc §14) this is the only file that changes.
 */

export class CatalogError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message)
    this.name = 'CatalogError'
  }
}

/** In-memory cache of results already seen this session. */
const cache = new Map<string, CatalogRacket[]>()

export async function searchRackets(
  q: string,
  { sport = 'tennis', limit = 8, signal }: { sport?: Sport; limit?: number; signal?: AbortSignal } = {},
): Promise<CatalogRacket[]> {
  const query = q.trim()
  if (!query) return []

  const key = `${sport}:${limit}:${query.toLowerCase()}`
  const hit = cache.get(key)
  if (hit) return hit

  const url = `/api/v1/catalog/rackets?q=${encodeURIComponent(query)}&sport=${sport}&limit=${limit}`
  const response = await fetch(url, { signal })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new CatalogError(
      body?.error?.message ?? "Can't reach the racket catalogue right now.",
      body?.error?.code ?? 'CATALOG_UNAVAILABLE',
    )
  }

  const { rackets } = (await response.json()) as { rackets: CatalogRacket[] }
  cache.set(key, rackets)
  return rackets
}

export async function fetchRacket(id: string | number): Promise<CatalogRacket> {
  const response = await fetch(`/api/v1/catalog/rackets/${id}`)
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new CatalogError(
      body?.error?.message ?? 'No racket with that id.',
      body?.error?.code ?? 'RACKET_NOT_FOUND',
    )
  }
  return (await response.json()) as CatalogRacket
}
