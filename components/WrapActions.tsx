'use client'

import { useState, useEffect, useCallback } from 'react'

interface WrapActionsProps {
  wrapId: string
  initialLikes: number
  textureUrl: string
  title: string
  onLikesUpdate?: (likes: number) => void
}

export default function WrapActions({
  wrapId,
  initialLikes,
  textureUrl,
  title,
  onLikesUpdate
}: WrapActionsProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [hasLiked, setHasLiked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Check initial like status from server
  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const response = await fetch(`/api/wrap/${wrapId}/like`)
        if (response.ok) {
          const data = await response.json()
          setHasLiked(data.liked)
        }
      } catch (error) {
        console.error('Failed to check like status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkLikeStatus()
  }, [wrapId])

  // Update likes when initialLikes prop changes
  useEffect(() => {
    setLikes(initialLikes)
  }, [initialLikes])

  // Toggle like status
  const handleToggleLike = useCallback(async () => {
    if (isToggling) return

    setIsToggling(true)

    // Optimistic update
    const prevLiked = hasLiked
    const prevLikes = likes
    const newLiked = !hasLiked
    const newLikes = newLiked ? likes + 1 : Math.max(0, likes - 1)

    setHasLiked(newLiked)
    setLikes(newLikes)
    if (onLikesUpdate) {
      onLikesUpdate(newLikes)
    }

    try {
      const response = await fetch(`/api/wrap/${wrapId}/like`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        // Update with server response (source of truth)
        setHasLiked(data.liked)
        setLikes(data.likes)
        if (onLikesUpdate) {
          onLikesUpdate(data.likes)
        }
      } else {
        // Revert on error
        setHasLiked(prevLiked)
        setLikes(prevLikes)
        if (onLikesUpdate) {
          onLikesUpdate(prevLikes)
        }
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
      // Revert on error
      setHasLiked(prevLiked)
      setLikes(prevLikes)
      if (onLikesUpdate) {
        onLikesUpdate(prevLikes)
      }
    } finally {
      setIsToggling(false)
    }
  }, [wrapId, hasLiked, likes, isToggling, onLikesUpdate])

  // Download texture and show modal
  const handleDownload = async () => {
    // Start download immediately
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

    // Show donation modal
    setShowModal(true)
  }

  // Handle donation
  const handleDonate = () => {
    window.open('https://www.paypal.com/donate?hosted_button_id=N8EMZTSSPYP6L', '_blank')
    setShowModal(false)
  }

  return (
    <div className="bg-transparent rounded border border-[#2a2a2a] p-6">
      <h3 className="text-base font-medium mb-4 text-[#ededed] tracking-tight">Actions</h3>
      <div className="space-y-3">
        <button
          onClick={handleToggleLike}
          disabled={isLoading || isToggling}
          className={`w-full px-4 py-2 text-sm font-medium rounded border transition-all flex items-center justify-center gap-2 ${
            hasLiked
              ? 'text-red-400 border-red-400/30 bg-red-400/10 hover:bg-red-400/20'
              : 'text-[#ededed] border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a]'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <svg
            className="w-4 h-4"
            fill={hasLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          {isLoading ? 'Loading...' : hasLiked ? `Liked (${likes})` : `${likes} ${likes === 1 ? 'Like' : 'Likes'}`}
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

      {/* Donation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="mb-4">
                <svg className="w-12 h-12 mx-auto text-[#ededed] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#ededed] mb-3">Your download has started!</h3>
              <p className="text-sm text-[#a0a0a0] mb-4 leading-relaxed">
                EvWrapStudio is completely free and will always remain free. However, maintaining and improving the platform takes time and resources. If you'd like to support the project, every contribution no matter how small is appreciated!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-[#a0a0a0] rounded border border-[#2a2a2a] bg-transparent hover:bg-[#ededed]/[0.05] transition-all"
              >
                No Thanks
              </button>
              <button
                onClick={handleDonate}
                className="flex-1 px-4 py-2 text-sm font-medium text-[#1a1a1a] rounded border border-[#ededed] bg-[#ededed] hover:bg-[#ededed]/90 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                Support Me
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
