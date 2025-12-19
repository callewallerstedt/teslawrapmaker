import { NextRequest, NextResponse } from 'next/server'
import { toggleWrapLike, checkUserLiked } from '@/lib/likes'

function getOrCreateUserKey(request: NextRequest) {
  const existing = request.cookies.get('evwrapstudio_uid')?.value
  if (existing) return { userKey: existing, shouldSetCookie: false }
  // Stable per-device identifier (prevents users liking multiple times due to IP changes)
  const userKey = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`) as string
  return { userKey, shouldSetCookie: true }
}

// POST /api/wrap/[id]/like - Toggle like status
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const wrapId = params.id
    const { userKey, shouldSetCookie } = getOrCreateUserKey(request)

    const result = await toggleWrapLike(wrapId, userKey)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to toggle like' },
        { status: 500 }
      )
    }

    const res = NextResponse.json({
      liked: result.liked,
      likes: result.likes
    })

    if (shouldSetCookie) {
      res.cookies.set('evwrapstudio_uid', userKey, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365 * 2,
      })
    }

    return res
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
    const { userKey, shouldSetCookie } = getOrCreateUserKey(request)

    const liked = await checkUserLiked(wrapId, userKey)

    const res = NextResponse.json({ liked })
    if (shouldSetCookie) {
      res.cookies.set('evwrapstudio_uid', userKey, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365 * 2,
      })
    }
    return res
  } catch (error) {
    console.error('Check like API error:', error)
    return NextResponse.json({ liked: false })
  }
}
