import { NextResponse } from 'next/server'
import { getCatalogRacket } from '@/lib/catalog-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/v1/catalog/rackets/:id — numeric racket_id or source_id (pcode). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const racket = await getCatalogRacket(id)
    if (!racket) {
      return NextResponse.json(
        {
          error: {
            code: 'RACKET_NOT_FOUND',
            message: 'No racket with that id.',
            severity: 'error',
          },
        },
        { status: 404 },
      )
    }
    return NextResponse.json(racket, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' },
    })
  } catch (error) {
    console.error('[catalog] lookup failed', error)
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
