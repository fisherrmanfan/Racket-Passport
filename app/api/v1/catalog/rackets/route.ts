import { NextResponse } from 'next/server'
import { searchCatalog } from '@/lib/catalog-db'
import type { Sport } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SPORTS: Sport[] = ['tennis', 'badminton', 'squash']

/**
 * GET /api/v1/catalog/rackets?q=pure+aero&sport=tennis&limit=8
 *
 * Catalogue typeahead (BACKEND doc §6). Global and unauthenticated — the
 * catalogue is shared across every tenant and the public recommendation tool
 * needs it without a session.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const q = params.get('q')?.trim() ?? ''
  const sportParam = params.get('sport')
  const sport = SPORTS.includes(sportParam as Sport) ? (sportParam as Sport) : 'tennis'
  const limit = Number.parseInt(params.get('limit') ?? '8', 10) || 8

  if (!q) return NextResponse.json({ count: 0, rackets: [] })

  try {
    const rackets = await searchCatalog(q, { limit, sport })
    return NextResponse.json(
      { count: rackets.length, rackets },
      // Same frame gets typed a hundred times a week; a short shared cache
      // costs nothing and takes the repeat keystrokes off the pooler.
      { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=300' } },
    )
  } catch (error) {
    console.error('[catalog] search failed', error)
    return NextResponse.json(
      {
        error: {
          code: 'CATALOG_UNAVAILABLE',
          message: "Can't reach the racket catalogue right now.",
          severity: 'error',
        },
      },
      { status: 503 },
    )
  }
}
