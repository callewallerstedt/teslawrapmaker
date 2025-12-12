import { NextResponse } from 'next/server'
import { getWraps } from '@/lib/db'

export async function GET() {
  try {
    const wraps = await getWraps()
    return NextResponse.json(wraps)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


