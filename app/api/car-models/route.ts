import { NextResponse } from 'next/server'
import { getCarModels } from '@/lib/db'

export async function GET() {
  try {
    const models = await getCarModels()
    return NextResponse.json(models)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

