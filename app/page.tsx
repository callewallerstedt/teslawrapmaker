import Link from 'next/link'
import Navigation from '@/components/Navigation'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] relative flex flex-col">
      {/* Plain static background */}

      <Navigation currentPath="/" />


      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 flex-1 flex items-center justify-center py-8">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-semibold mb-6 tracking-tight text-[#ededed]/90 leading-none" style={{ fontFamily: 'Anton, sans-serif', letterSpacing: '0.05em' }}>
            EvWrapStudio
          </h1>
          <p className="text-base sm:text-xl text-[#a0a0a0] max-w-2xl mx-auto mb-12 font-light leading-relaxed">
          Create and explore custom wraps for your Tesla.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Link
              href="/explore"
              className="px-8 py-4 text-lg font-medium text-[#ededed] rounded-lg border-2 border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a] transition-all transform hover:scale-105"
            >
              Explore Wraps
            </Link>
            <Link
              href="/design"
              className="px-8 py-4 text-lg font-medium text-[#1a1a1a] rounded-lg border-2 border-[#ededed] bg-[#ededed] hover:bg-[#ededed]/90 transition-all transform hover:scale-105"
            >
              Create Your Own
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-auto z-50 pb-4 pt-2">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
          <div className="flex justify-center">
            <div className="flex gap-8 text-xs">
              <a href="/privacy" className="text-[#a0a0a0] hover:text-[#ededed] transition-colors cursor-pointer">
                Privacy
              </a>
              <a href="/terms" className="text-[#a0a0a0] hover:text-[#ededed] transition-colors cursor-pointer">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
