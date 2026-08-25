import { NextResponse } from 'next/server'
import { catalogCount } from '@/lib/catalog-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/v1/health — app up *and* the catalogue reachable. */
export async function GET() {
  try {
    const rackets = await catalogCount()
    return NextResponse.json({ status: 'ok', catalogue: { rackets } })
  } catch (error) {
    return NextResponse.json(
      { status: 'degraded', catalogue: { error: (error as Error).message } },
      { status: 503 },
    )
  }
}
