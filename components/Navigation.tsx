'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import SupportModal from './SupportModal'

interface NavigationProps {
  currentPath?: string
}

export default function Navigation({ currentPath = '/' }: NavigationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [showSupportModal, setShowSupportModal] = useState(false)

  useEffect(() => {
    const q = (searchParams.get('query') || '').trim()
    setQuery(q)
  }, [searchParams, currentPath])

  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true
    if (path !== '/' && currentPath.startsWith(path)) return true
    return false
  }

  return (
    <nav className="relative z-20 border-b border-[#2a2a2a] bg-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
        <div className="relative flex flex-col sm:flex-row sm:items-center py-2 gap-2">
          <Link
            href="/"
            className="text-xl sm:text-2xl font-semibold text-[#ededed] tracking-tight whitespace-nowrap z-10"
            style={{ fontFamily: 'Anton, sans-serif', letterSpacing: '0.05em' }}
          >
              EvWrapStudio
          </Link>

          <form
            className="w-full sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2 max-w-xl sm:w-96"
            onSubmit={(e) => {
              e.preventDefault()
              const q = query.trim()
              if (!q) {
                router.push('/explore')
                return
              }

              // If already on explore, preserve other filters in the URL.
              if (currentPath.startsWith('/explore')) {
                const sp = new URLSearchParams(searchParams.toString())
                sp.set('query', q)
                router.push(`/explore?${sp.toString()}`)
                return
              }

              router.push(`/explore?query=${encodeURIComponent(q)}`)
            }}
          >
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#707070]"
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search wraps, users, descriptions..."
                className="w-full pl-10 pr-3 py-2 bg-[#ededed]/[0.10] border border-[#2a2a2a] rounded text-[#ededed] placeholder-[#707070] focus:outline-none focus:border-[#3a3a3a] focus:bg-[#ededed]/[0.14] transition-all font-light"
              />
            </div>
          </form>

          {/* Navigation Tabs */}
          <div className="flex w-full sm:w-auto gap-0 sm:ml-auto">
            <Link
              href="/explore"
              className={`flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 text-sm font-medium transition-all ${
                isActive('/explore')
                  ? 'text-[#ededed] border-b-2 border-[#ededed] bg-[#ededed]/[0.08]'
                  : 'text-[#a0a0a0] hover:text-[#ededed] border-b-2 border-transparent hover:bg-[#ededed]/[0.05]'
              }`}
            >
              Explore
            </Link>
            <Link
              href="/design"
              className={`flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 text-sm font-medium transition-all ${
                isActive('/design')
                  ? 'text-[#ededed] border-b-2 border-[#ededed] bg-[#ededed]/[0.08]'
                  : 'text-[#a0a0a0] hover:text-[#ededed] border-b-2 border-transparent hover:bg-[#ededed]/[0.05]'
              }`}
            >
              Create
            </Link>
            <button
              onClick={() => setShowSupportModal(true)}
              className="flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 text-sm font-medium text-[#a0a0a0] hover:text-[#ededed] border-b-2 border-transparent hover:bg-[#ededed]/[0.05] transition-all"
            >
              Support Me
            </button>
          </div>
        </div>
      </div>

      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </nav>
  )
}
