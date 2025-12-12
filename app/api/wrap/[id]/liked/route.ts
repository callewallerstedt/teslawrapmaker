import { NextRequest, NextResponse } from 'next/server'
import { hasUserLikedWrap } from '@/lib/db'

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
  
  return request.ip || 'unknown'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const wrapId = params.id
    const clientIP = getClientIP(request)
    
    const liked = await hasUserLikedWrap(wrapId, clientIP)
    
    return NextResponse.json({ liked })
  } catch (error) {
    console.error('Check liked error:', error)
    return NextResponse.json({ liked: false })
  }
}

