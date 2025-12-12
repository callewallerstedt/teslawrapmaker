import { NextResponse } from 'next/server'
import { getWrap } from '@/lib/db'

// Disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const wrap = await getWrap(params.id)
    if (!wrap) {
      return NextResponse.json({ error: 'Wrap not found' }, { status: 404 })
    }
    return NextResponse.json(wrap, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}






