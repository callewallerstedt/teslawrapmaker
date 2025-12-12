import { NextResponse } from 'next/server'
import { getCarModel } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const model = await getCarModel(params.id)
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }
    return NextResponse.json(model)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}






