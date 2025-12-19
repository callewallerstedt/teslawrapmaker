import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWrap, getCarModel } from '@/lib/db'
import WrapPageClient from '@/components/WrapPageClient'
import Navigation from '@/components/Navigation'
import LiquidBackground from '@/components/LiquidBackground'

// Disable caching for this page - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const wrap = await getWrap(params.id)
  if (!wrap) {
    return {
      title: 'Wrap not found',
      robots: { index: false, follow: false },
    }
  }

  const carModel = await getCarModel(wrap.carModelId)
  const title = wrap.title
  const description =
    wrap.description ||
    `A custom wrap for ${carModel?.name || wrap.carModelId}${wrap.username ? ` by ${wrap.username}` : ''}.`

  const imageUrl = `/api/og/wrap/${wrap.id}`
  const canonical = `/wrap/${wrap.id}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonical,
      images: [
        {
          url: imageUrl,
          width: 1024,
          height: 1024,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function WrapPage({ params }: { params: { id: string } }) {
  const wrap = await getWrap(params.id)
  if (!wrap) {
    notFound()
  }

  const carModel = await getCarModel(wrap.carModelId)

  return (
    <div className="min-h-screen bg-[#1a1a1a] relative">
      <LiquidBackground opacity={0.5} />
      <Navigation currentPath="/explore" />

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-8">
        <WrapPageClient
          wrap={wrap}
          carModelName={carModel?.name || wrap.carModelId}
        />
      </main>
    </div>
  )
}
