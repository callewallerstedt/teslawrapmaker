import { NextRequest, NextResponse } from 'next/server'
import { getWrap } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const wrap = await getWrap(params.id)
  if (!wrap) {
    return new NextResponse('Not found', { status: 404 })
  }

  const src = wrap.textureUrl

  let contentType = 'image/png'
  let bytes: Uint8Array

  if (src.startsWith('data:')) {
    const match = src.match(/^data:([^;]+);base64,(.*)$/)
    if (!match) {
      return new NextResponse('Invalid data URL', { status: 400 })
    }

    contentType = match[1] || contentType
    if (!contentType.startsWith('image/')) {
      return new NextResponse('Unsupported content type', { status: 415 })
    }

    bytes = Uint8Array.from(Buffer.from(match[2], 'base64'))
  } else {
    const res = await fetch(src)
    if (!res.ok) {
      return new NextResponse('Failed to fetch image', { status: 502 })
    }
    contentType = res.headers.get('content-type') || contentType
    bytes = new Uint8Array(await res.arrayBuffer())
  }

  const body =
    bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
      ? bytes.buffer
      : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)

  return new NextResponse(body as ArrayBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
