import { notFound } from 'next/navigation'
import { getWrap, getCarModel } from '@/lib/db'
import Link from 'next/link'
import WrapPageClient from '@/components/WrapPageClient'

export default async function WrapPage({ params }: { params: { id: string } }) {
  const wrap = await getWrap(params.id)
  if (!wrap) {
    notFound()
  }

  const carModel = await getCarModel(wrap.carModelId)

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <nav className="border-b border-[#2a2a2a] bg-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-semibold text-[#ededed] tracking-tight">
                TeslaWrapMaker
              </Link>
              <Link
                href="/explore"
                className="text-sm text-[#a0a0a0] hover:text-[#ededed] transition-colors font-medium"
              >
                Explore
              </Link>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-[#ededed] rounded border border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a] transition-all"
              >
                Create Your Own Wrap
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-8">
        <WrapPageClient wrap={wrap} />
      </main>
    </div>
  )
}

