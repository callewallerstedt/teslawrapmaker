import { NextResponse } from 'next/server'
import { getWraps } from '@/lib/db'

// Disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limitRaw = url.searchParams.get('limit')
    const offsetRaw = url.searchParams.get('offset')
    const sortRaw = url.searchParams.get('sort')
    const searchQuery = (url.searchParams.get('query') || '').trim()
    const carModelId = (url.searchParams.get('carModelId') || '').trim()

    const limit = limitRaw ? Math.max(1, Math.min(60, Number(limitRaw))) : undefined
    const offset = offsetRaw ? Math.max(0, Number(offsetRaw)) : 0
    const sort = sortRaw === 'latest' ? 'latest' : 'most-liked'

    const wraps = await getWraps({
      limit,
      offset,
      sort,
      searchQuery: searchQuery || undefined,
      carModelId: carModelId || undefined,
    })
    return NextResponse.json(wraps, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}





