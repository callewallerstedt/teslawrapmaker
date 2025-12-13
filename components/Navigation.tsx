import Link from 'next/link'

interface NavigationProps {
  currentPath?: string
}

export default function Navigation({ currentPath = '/' }: NavigationProps) {
  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true
    if (path !== '/' && currentPath.startsWith(path)) return true
    return false
  }

  return (
    <nav className="border-b border-[#2a2a2a] bg-transparent backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 gap-2">
          <Link
            href="/"
            className="text-xl sm:text-2xl font-semibold text-[#ededed] tracking-tight whitespace-nowrap"
            style={{ fontFamily: 'Anton, sans-serif', letterSpacing: '0.05em' }}
          >
              EvWrapStudio
          </Link>

          {/* Navigation Tabs */}
          <div className="flex w-full sm:w-auto gap-0">
            <Link
              href="/"
              className={`flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 text-sm font-medium transition-all ${
                isActive('/')
                  ? 'text-[#ededed] border-b-2 border-[#ededed] bg-[#ededed]/[0.08]'
                  : 'text-[#a0a0a0] hover:text-[#ededed] border-b-2 border-transparent hover:bg-[#ededed]/[0.05]'
              }`}
            >
              Home
            </Link>
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
          </div>
        </div>
      </div>
    </nav>
  )
}
