import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getWrap, getCarModel } from '@/lib/db'
import WrapPageClient from '@/components/WrapPageClient'
import Navigation from '@/components/Navigation'
import LiquidBackground from '@/components/LiquidBackground'

// Disable caching for this page - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const headerList = headers()
  const host = headerList.get('x-forwarded-host') || headerList.get('host')
  const proto = headerList.get('x-forwarded-proto') || (process.env.NODE_ENV === 'development' ? 'http' : 'https')
  const baseUrl =
    (host ? `${proto}://${host}` : null) ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000'

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

  const imageUrl = new URL(`/api/og/wrap/${wrap.id}`, baseUrl).toString()
  const canonical = new URL(`/wrap/${wrap.id}`, baseUrl).toString()

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
          width: 1200,
          height: 630,
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
  const siteBase =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'https://www.evwrapstudio.com/'
  const canonical = new URL(`/wrap/${wrap.id}`, siteBase).toString()
  const imageUrl = new URL(`/api/og/wrap/${wrap.id}`, siteBase).toString()
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: wrap.title,
    description:
      wrap.description ||
      `A custom Tesla wrap${carModel?.name ? ` for ${carModel.name}` : ''}${wrap.username ? ` by ${wrap.username}` : ''}.`,
    image: imageUrl,
    url: canonical,
    datePublished: wrap.createdAt,
    creator: wrap.username ? { '@type': 'Person', name: wrap.username } : undefined,
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] relative">
      <LiquidBackground opacity={0.5} />
      <Navigation currentPath="/explore" />

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-8">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <WrapPageClient
          wrap={wrap}
          carModelName={carModel?.name || wrap.carModelId}
        />
      </main>
    </div>
  )
}
