'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Wrap } from '@/lib/types'

export default function ExplorePage() {
  const router = useRouter()
  const [wraps, setWraps] = useState<Wrap[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadWraps() {
      try {
        const response = await fetch('/api/wraps')
        if (response.ok) {
          const data = await response.json()
          setWraps(data)
        }
      } catch (error) {
        console.error('Failed to load wraps:', error)
      } finally {
        setLoading(false)
      }
    }
    loadWraps()
  }, [])

  const filteredWraps = wraps.filter((wrap) =>
    wrap.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <nav className="border-b border-[#2a2a2a] bg-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-xl font-semibold text-[#ededed] hover:text-[#ededed] transition-colors tracking-tight"
              >
                TeslaWrapMaker
              </button>
              <button
                onClick={() => router.push('/explore')}
                className="text-sm text-[#a0a0a0] hover:text-[#ededed] transition-colors font-medium"
              >
                Explore
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-sm font-medium text-[#ededed] rounded border border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a] transition-all"
              >
                Create Your Own Wrap
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-[#ededed] mb-2 tracking-tight">Explore</h1>
          <p className="text-[#a0a0a0] font-light">Browse wraps created by the community</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 flex justify-center">
          <div className="relative max-w-md w-full">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#707070]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search wraps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#ededed]/[0.12] border border-[#2a2a2a] rounded text-[#ededed] placeholder-[#707070] focus:outline-none focus:border-[#3a3a3a] focus:bg-[#ededed]/[0.18] transition-all font-light"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ededed]"></div>
          </div>
        ) : filteredWraps.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="w-16 h-16 mx-auto text-[#707070] mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-[#a0a0a0] text-lg font-light mb-2">
              {searchQuery ? 'No wraps found matching your search' : 'No wraps published yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => router.push('/')}
                className="mt-4 inline-block px-6 py-2 text-sm font-medium text-[#ededed] rounded border border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a] transition-all"
              >
                Create a Wrap
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredWraps.map((wrap) => (
              <Link
                key={wrap.id}
                href={`/wrap/${wrap.id}`}
                className="group bg-transparent rounded border border-[#2a2a2a] overflow-hidden hover:border-[#3a3a3a] transition-all hover:bg-[#ededed]/[0.05]"
              >
                <div className="aspect-video bg-[#1a1a1a] relative overflow-hidden">
                  {wrap.textureUrl ? (
                    <img
                      src={wrap.textureUrl}
                      alt={wrap.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback if image fails to load
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
                      <svg
                        className="w-12 h-12 text-[#707070]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-[#ededed]/[0.05] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-medium text-[#ededed] mb-1 tracking-tight line-clamp-2 group-hover:text-[#ededed] transition-colors">
                    {wrap.title}
                  </h3>
                  {wrap.username && (
                    <p className="text-xs text-[#707070] mb-2 font-light">by {wrap.username}</p>
                  )}
                  {wrap.description && (
                    <p className="text-xs text-[#a0a0a0] mb-2 font-light line-clamp-2">{wrap.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-[#707070] font-light">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      <span>{wrap.likes}</span>
                    </div>
                    <span>•</span>
                    <span>{new Date(wrap.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

