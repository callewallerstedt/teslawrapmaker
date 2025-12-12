import { NextRequest, NextResponse } from 'next/server'
import { toggleWrapLike, checkUserLiked } from '@/lib/likes'

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  return request.ip || '127.0.0.1'
}

// POST /api/wrap/[id]/like - Toggle like status
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const wrapId = params.id
    const clientIP = getClientIP(request)

    const result = await toggleWrapLike(wrapId, clientIP)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to toggle like' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      liked: result.liked,
      likes: result.likes
    })
  } catch (error) {
    console.error('Like API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/wrap/[id]/like - Check if user has liked
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const wrapId = params.id
    const clientIP = getClientIP(request)

    const liked = await checkUserLiked(wrapId, clientIP)

    return NextResponse.json({ liked })
  } catch (error) {
    console.error('Check like API error:', error)
    return NextResponse.json({ liked: false })
  }
}
