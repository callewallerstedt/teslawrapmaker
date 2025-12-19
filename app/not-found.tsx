import Link from 'next/link'
import Navigation from '@/components/Navigation'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Navigation currentPath="/" />
      <main className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-16">
        <div className="max-w-xl">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#ededed] tracking-tight mb-2">Page not found</h1>
          <p className="text-[#a0a0a0] font-light mb-6">
            The page you’re looking for doesn’t exist.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#ededed] rounded border border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a] transition-all"
          >
            Go home
          </Link>
        </div>
      </main>
    </div>
  )
}

