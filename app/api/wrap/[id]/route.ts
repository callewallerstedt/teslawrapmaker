import { NextResponse } from 'next/server'
import { getWrap } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const wrap = await getWrap(params.id)
    if (!wrap) {
      return NextResponse.json({ error: 'Wrap not found' }, { status: 404 })
    }
    return NextResponse.json(wrap)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


