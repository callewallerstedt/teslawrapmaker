import Link from 'next/link'
import Navigation from '@/components/Navigation'
import LiquidBackground from '@/components/LiquidBackground'
import { getWraps } from '@/lib/db'

export default async function HomePage() {
  const topWraps = await getWraps({ limit: 3, sort: 'most-liked' })

  return (
    <div className="min-h-screen bg-[#1a1a1a] relative isolate flex flex-col" style={{
      minHeight: '100dvh' // Use dynamic viewport height if supported, fallback to 100vh
    }}>
      <LiquidBackground />

      <div className="relative z-10">
        <Navigation currentPath="/" />
      </div>


      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 flex-1 flex justify-center py-8 min-h-0">
        <div className="w-full mt-16">
          <div className="text-center pt-8">
          <h1 className="text-4xl sm:text-6xl font-semibold mb-6 tracking-tight text-[#ededed]/90 leading-none" style={{ fontFamily: 'Anton, sans-serif', letterSpacing: '0.05em' }}>
            EvWrapStudio
          </h1>
          <p className="text-base sm:text-xl text-[#a0a0a0] max-w-2xl mx-auto mb-12 font-light leading-relaxed">
          Create and explore custom wraps for your Tesla.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Link
              href="/explore"
              className="px-8 py-4 text-lg font-medium text-[#ededed] rounded-lg transition-all transform hover:scale-105 relative overflow-hidden hover:bg-[#ededed]/[0.18]"
              style={{
                background: 'rgba(237,237,237,0.12)',
                boxShadow: 'inset 0 0 0 1px rgba(237,237,237,0.15), inset 0 0 0 2px rgba(237,237,237,0.07), inset 0 0 0 3px rgba(237,237,237,0.03), inset 0 0 0 4px rgba(237,237,237,0.012), inset 0 0 0 5px rgba(237,237,237,0.005), inset 0 0 0 6px rgba(237,237,237,0.002), inset 0 0 0 7px rgba(237,237,237,0.001)'
              }}
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

          {topWraps.length > 0 && (
            <section className="mt-14">
              <div className="flex items-end justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#ededed] tracking-tight">Top wraps</h2>
                  <p className="text-sm text-[#a0a0a0] font-light">Most liked right now</p>
                </div>
                <Link
                  href="/explore"
                  className="text-sm text-[#ededed] hover:text-[#ededed]/90 border border-[#2a2a2a] rounded px-3 py-1.5 bg-[#ededed]/[0.08] hover:bg-[#ededed]/[0.12] transition-all"
                >
                  View all
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topWraps.map((wrap, idx) => (
                  <Link
                    key={wrap.id}
                    href={`/wrap/${wrap.id}`}
                    className="group rounded-xl border border-[#2a2a2a] overflow-hidden bg-[#1a1a1a]/40 hover:bg-[#1a1a1a]/55 hover:border-[#3a3a3a] transition-all"
                  >
                    <div className="relative aspect-square bg-[#1a1a1a] overflow-hidden p-3">
                      <img
                        src={wrap.previewRenderUrl || wrap.textureUrl}
                        alt={wrap.title}
                        className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                      <div className="absolute left-3 top-3 text-[11px] px-2 py-1 rounded-full border border-white/15 bg-black/30 text-white/80">
                        #{idx + 1}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-medium text-[#ededed] tracking-tight line-clamp-2">{wrap.title}</h3>
                        <div className="flex items-center gap-1 text-xs text-[#a0a0a0] font-light shrink-0">
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
                      </div>
                      {wrap.username && (
                        <div className="text-xs text-[#707070] font-light mt-1">by {wrap.username}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="mt-auto pb-4 pt-2">
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
