import { notFound } from 'next/navigation'
import { getWrap, getCarModel } from '@/lib/db'
import WrapPageClient from '@/components/WrapPageClient'
import Navigation from '@/components/Navigation'

// Disable caching for this page - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function WrapPage({ params }: { params: { id: string } }) {
  const wrap = await getWrap(params.id)
  if (!wrap) {
    notFound()
  }

  const carModel = await getCarModel(wrap.carModelId)

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Navigation currentPath="/explore" />

      <main className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-8">
        <WrapPageClient
          wrap={wrap}
          carModelName={carModel?.name || wrap.carModelId}
        />
      </main>
    </div>
  )
}
