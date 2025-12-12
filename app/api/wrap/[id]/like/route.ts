import { NextRequest, NextResponse } from 'next/server'
import { likeWrap, hasUserLikedWrap } from '@/lib/db'

// Get client IP address
function getClientIP(request: NextRequest): string {
  // Try various headers for IP (handles proxies, load balancers, etc.)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Fallback to connection remote address
  return request.ip || 'unknown'
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const wrapId = params.id
    const clientIP = getClientIP(request)
    
    // Check if user has already liked this wrap
    const alreadyLiked = await hasUserLikedWrap(wrapId, clientIP)
    
    if (alreadyLiked) {
      return NextResponse.json(
        { error: 'You have already liked this wrap', alreadyLiked: true },
        { status: 400 }
      )
    }
    
    // Like the wrap
    const wrap = await likeWrap(wrapId, clientIP)
    if (!wrap) {
      return NextResponse.json({ error: 'Wrap not found' }, { status: 404 })
    }
    
    // Return updated wrap data
    return NextResponse.json({ likes: wrap.likes, liked: true })
  } catch (error) {
    console.error('Like error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

