import { NextRequest, NextResponse } from 'next/server'
import { getWrap } from '@/lib/db'
import sharp from 'sharp'

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

  // Generate an OG-friendly image (1200x630) that shows the full wrap (no cropping by link previews).
  // Fallback to the raw image bytes if processing fails.
  try {
    const ogWidth = 1200
    const ogHeight = 630
    const padding = 40
    const maxSide = Math.min(ogWidth - padding * 2, ogHeight - padding * 2)

    const inputBuffer = Buffer.from(
      bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
        ? new Uint8Array(bytes.buffer)
        : new Uint8Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
    )

    const resized = await sharp(inputBuffer)
      .resize(maxSide, maxSide, {
        fit: 'contain',
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toBuffer()

    const resizedMeta = await sharp(resized).metadata()
    const left = Math.max(0, Math.round((ogWidth - (resizedMeta.width || maxSide)) / 2))
    const top = Math.max(0, Math.round((ogHeight - (resizedMeta.height || maxSide)) / 2))

    const frameSvg = Buffer.from(
      `<svg width="${ogWidth}" height="${ogHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="18" width="${ogWidth - 36}" height="${ogHeight - 36}" rx="36" ry="36" fill="none" stroke="#d00000" stroke-width="8"/>
      </svg>`
    )

    const ogPng = await sharp({
      create: {
        width: ogWidth,
        height: ogHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        { input: resized, left, top },
        { input: frameSvg, top: 0, left: 0 },
      ])
      .png()
      .toBuffer()

    return new NextResponse(new Uint8Array(ogPng), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (error) {
    console.error('OG image generation failed, falling back to raw image:', error)
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
