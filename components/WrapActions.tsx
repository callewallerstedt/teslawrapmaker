'use client'

import { useState, useEffect } from 'react'

interface WrapActionsProps {
  wrapId: string
  initialLikes: number
  textureUrl: string
  title: string
  onLikesUpdate?: (likes: number) => void
}

const LIKED_WRAPS_KEY = 'teslawrapmaker_liked_wraps'

export default function WrapActions({ wrapId, initialLikes, textureUrl, title, onLikesUpdate }: WrapActionsProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [isLiking, setIsLiking] = useState(false)
  const [hasLiked, setHasLiked] = useState(false)

  // Check localStorage and server on mount
  useEffect(() => {
    const checkLiked = async () => {
      // Check localStorage first
      const likedWraps = JSON.parse(localStorage.getItem(LIKED_WRAPS_KEY) || '[]')
      if (likedWraps.includes(wrapId)) {
        setHasLiked(true)
        return
      }
      
      // Also check server
      try {
        const response = await fetch(`/api/wrap/${wrapId}/liked`)
        if (response.ok) {
          const data = await response.json()
          if (data.liked) {
            setHasLiked(true)
            // Update localStorage to match server
            const likedWraps = JSON.parse(localStorage.getItem(LIKED_WRAPS_KEY) || '[]')
            if (!likedWraps.includes(wrapId)) {
              likedWraps.push(wrapId)
              localStorage.setItem(LIKED_WRAPS_KEY, JSON.stringify(likedWraps))
            }
          }
        }
      } catch (error) {
        console.error('Failed to check like status:', error)
      }
    }
    
    checkLiked()
  }, [wrapId])

  // Update likes when initialLikes changes (e.g., after page refresh)
  useEffect(() => {
    setLikes(initialLikes)
  }, [initialLikes])

  const handleLike = async () => {
    if (isLiking || hasLiked) return
    
    setIsLiking(true)
    // Optimistically update UI
    const newLikes = likes + 1
    setLikes(newLikes)
    setHasLiked(true)
    
    // Save to localStorage
    const likedWraps = JSON.parse(localStorage.getItem(LIKED_WRAPS_KEY) || '[]')
    likedWraps.push(wrapId)
    localStorage.setItem(LIKED_WRAPS_KEY, JSON.stringify(likedWraps))
    
    if (onLikesUpdate) {
      onLikesUpdate(newLikes)
    }
    
    try {
      const response = await fetch(`/api/wrap/${wrapId}/like`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        // Update with server response
        setLikes(data.likes)
        if (onLikesUpdate) {
          onLikesUpdate(data.likes)
        }
      } else {
        const errorData = await response.json()
        // If already liked on server, keep the like state
        if (errorData.alreadyLiked) {
          // Already liked, keep UI state
          return
        }
        // Revert on other errors
        setLikes(likes)
        setHasLiked(false)
        const likedWraps = JSON.parse(localStorage.getItem(LIKED_WRAPS_KEY) || '[]')
        const updated = likedWraps.filter((id: string) => id !== wrapId)
        localStorage.setItem(LIKED_WRAPS_KEY, JSON.stringify(updated))
        if (onLikesUpdate) {
          onLikesUpdate(initialLikes)
        }
      }
    } catch (error) {
      console.error('Failed to like:', error)
      // Revert on error
      setLikes(likes)
      setHasLiked(false)
      const likedWraps = JSON.parse(localStorage.getItem(LIKED_WRAPS_KEY) || '[]')
      const updated = likedWraps.filter((id: string) => id !== wrapId)
      localStorage.setItem(LIKED_WRAPS_KEY, JSON.stringify(updated))
      if (onLikesUpdate) {
        onLikesUpdate(initialLikes)
      }
    } finally {
      setIsLiking(false)
    }
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(textureUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_texture.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download:', error)
    }
  }

  return (
    <div className="bg-transparent rounded border border-[#2a2a2a] p-6">
      <h3 className="text-base font-medium mb-4 text-[#ededed] tracking-tight">Actions</h3>
      <div className="space-y-3">
        <button
          onClick={handleLike}
          disabled={isLiking || hasLiked}
          className={`w-full px-4 py-2 text-sm font-medium rounded border transition-all flex items-center justify-center gap-2 ${
            hasLiked
              ? 'text-[#707070] border-[#2a2a2a] bg-[#ededed]/[0.05] cursor-not-allowed'
              : 'text-[#ededed] border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a] disabled:opacity-30 disabled:cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4" fill={hasLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          {hasLiked ? 'Liked' : `${likes} ${likes === 1 ? 'Like' : 'Likes'}`}
        </button>
        <button
          onClick={handleDownload}
          className="w-full px-4 py-2 text-sm font-medium text-[#ededed] rounded border border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a] transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download Texture
        </button>
      </div>
    </div>
  )
}

