'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Wrap, CarModel } from '@/lib/types'
import Navigation from '@/components/Navigation'

export default function ExplorePage() {
  const router = useRouter()
  const [wraps, setWraps] = useState<Wrap[]>([])
  const [carModels, setCarModels] = useState<CarModel[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedModelId, setSelectedModelId] = useState('')
  const [sortBy, setSortBy] = useState<'random' | 'most-liked' | 'latest'>('latest')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch wraps via API so the server-side DB helper is used
        const wrapsRes = await fetch('/api/wraps')
        if (wrapsRes.ok) {
          const wrapsData: Wrap[] = await wrapsRes.json()
          setWraps(wrapsData)
        } else {
          console.error('Failed to fetch wraps:', wrapsRes.status, wrapsRes.statusText)
        }

        // Fetch car models via API (static from public folder)
        const modelsRes = await fetch('/api/car-models')
        if (modelsRes.ok) {
          const modelsData: CarModel[] = await modelsRes.json()
          setCarModels(modelsData)
        } else {
          console.error('Failed to fetch car models:', modelsRes.status, modelsRes.statusText)
        }
      } catch (error) {
        console.error('Failed to load explore data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const carModelNameById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const model of carModels) {
      map[model.id] = model.name
    }
    return map
  }, [carModels])

  const filteredWraps = (() => {
    // First filter
    const filtered = wraps.filter((wrap) => {
      const matchesSearch = wrap.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesModel = !selectedModelId || wrap.carModelId === selectedModelId
      return matchesSearch && matchesModel
    })

    // Then sort
    switch (sortBy) {
      case 'random':
        return [...filtered].sort(() => Math.random() - 0.5)
      case 'most-liked':
        return [...filtered].sort((a, b) => (b.likes || 0) - (a.likes || 0))
      case 'latest':
      default:
        return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
  })()

  console.log('Filtered wraps:', filteredWraps.length, 'out of', wraps.length)

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Navigation currentPath="/explore" />

      <main className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-[#ededed] mb-2 tracking-tight">Explore</h1>
          <p className="text-[#a0a0a0] font-light">Browse wraps created by the community</p>
        </div>

        {/* Search + Filters */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1 max-w-md">
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

          <div className="flex gap-3">
            <div className="w-48">
              <div className="relative">
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-transparent border border-[#2a2a2a] rounded-lg text-[#ededed] focus:outline-none focus:border-[#3a3a3a] focus:bg-[#ededed]/[0.05] transition-all font-light appearance-none pr-8 cursor-pointer hover:border-[#3a3a3a]"
                >
                  <option value="" className="bg-[#1a1a1a] text-[#ededed]">All models</option>
                  {carModels.map((model) => (
                    <option key={model.id} value={model.id} className="bg-[#1a1a1a] text-[#ededed]">
                      {model.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-[#707070]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="w-40">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'random' | 'most-liked' | 'latest')}
                  className="w-full px-4 py-2.5 bg-transparent border border-[#2a2a2a] rounded-lg text-[#ededed] focus:outline-none focus:border-[#3a3a3a] focus:bg-[#ededed]/[0.05] transition-all font-light appearance-none pr-8 cursor-pointer hover:border-[#3a3a3a]"
                >
                  <option value="latest" className="bg-[#1a1a1a] text-[#ededed]">Latest</option>
                  <option value="most-liked" className="bg-[#1a1a1a] text-[#ededed]">Most Liked</option>
                  <option value="random" className="bg-[#1a1a1a] text-[#ededed]">Random</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-[#707070]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
              </div>
            </div>
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
                        console.error('Image failed to load:', wrap.textureUrl, e)
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
                  {carModelNameById[wrap.carModelId] && (
                    <p className="text-xs text-[#707070] mb-1 font-light">
                      {carModelNameById[wrap.carModelId]}
                    </p>
                  )}
                  {wrap.username && (
                    <p className="text-xs text-[#707070] mb-2 font-light">by {wrap.username}</p>
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
                    <span>·</span>
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
