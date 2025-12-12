'use client'

import { useState, useEffect } from 'react'
import { Wrap } from '@/lib/types'
import WrapActions from './WrapActions'

interface WrapPageClientProps {
  wrap: Wrap
  carModelName?: string
}

export default function WrapPageClient({ wrap, carModelName }: WrapPageClientProps) {
  const [likes, setLikes] = useState(wrap.likes)

  // Update likes when wrap prop changes
  useEffect(() => {
    setLikes(wrap.likes)
  }, [wrap.likes])

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-transparent rounded border border-[#2a2a2a] p-4">
            <div className="bg-[#1a1a1a] rounded overflow-hidden border border-[#2a2a2a]">
              <img
                src={wrap.textureUrl}
                alt={wrap.title}
                className="w-full h-auto"
                style={{ imageRendering: 'auto' }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Metadata section */}
          <div className="bg-transparent rounded border border-[#2a2a2a] p-4 space-y-4">
            <div>
              <h1 className="text-2xl font-semibold text-[#ededed] mb-1 tracking-tight">{wrap.title}</h1>
              {wrap.username && (
                <p className="text-sm text-[#a0a0a0] mb-1 font-light">by {wrap.username}</p>
              )}
              {carModelName && (
                <p className="text-sm text-[#707070] mb-2 font-light">{carModelName}</p>
              )}
            </div>

            {wrap.description && (
              <div className="bg-[#1a1a1a] rounded border border-[#2a2a2a] p-3">
                <p className="text-sm text-[#a0a0a0] font-light leading-relaxed whitespace-pre-wrap">
                  {wrap.description}
                </p>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-[#707070] font-light">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>
                  {likes} {likes === 1 ? 'like' : 'likes'}
                </span>
              </div>
              <span>•</span>
              <span>{new Date(wrap.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <WrapActions
            wrapId={wrap.id}
            initialLikes={likes}
            textureUrl={wrap.textureUrl}
            title={wrap.title}
            onLikesUpdate={setLikes}
          />
        </div>
      </div>
    </>
  )
}
