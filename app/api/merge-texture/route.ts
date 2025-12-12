import { NextRequest, NextResponse } from 'next/server'
import { mergeTexture } from '@/lib/mergeTexture'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { baseTextureUrl, layers } = body

    if (!baseTextureUrl || !layers || !Array.isArray(layers)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Fetch base texture
    const baseResponse = await fetch(baseTextureUrl)
    if (!baseResponse.ok) {
      // If it's a local path, create a placeholder
      const placeholderBuffer = Buffer.alloc(1024 * 1024, 0) // 1MB placeholder
      const merged = await mergeTexture(placeholderBuffer, layers)
      return new NextResponse(merged, {
        headers: {
          'Content-Type': 'image/png',
        },
      })
    }

    const baseBuffer = Buffer.from(await baseResponse.arrayBuffer())

    // Merge textures
    const merged = await mergeTexture(baseBuffer, layers)

    return new NextResponse(merged, {
      headers: {
        'Content-Type': 'image/png',
      },
    })
  } catch (error) {
    console.error('Merge texture error:', error)
    return NextResponse.json({ error: 'Merge failed' }, { status: 500 })
  }
}


