import Navigation from '@/components/Navigation'
import LicensePlateDesigner from '@/components/LicensePlateDesigner'
import { listLicensePlates } from '@/lib/licensePlates'
import { notFound } from 'next/navigation'

type Props = {
  params: { slug: string }
}

export default async function LicensePlateDesignPage({ params }: Props) {
  const plates = await listLicensePlates()
  const plate = plates.find((p) => p.slug === params.slug)
  if (!plate) notFound()

  return (
    <div className="min-h-screen bg-[#1a1a1a] relative flex flex-col" style={{ minHeight: '100dvh' }}>
      <Navigation currentPath="/license-plate" />

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 flex-1 py-8 min-h-0 w-full">
        <div className="mb-6">
          <div className="text-sm text-[#a0a0a0]">
            <a href="/license-plate" className="hover:text-[#ededed] transition-colors">
              License plates
            </a>{' '}
            <span className="text-[#555]">/</span> <span className="text-[#ededed]">{plate.displayName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#ededed]/90 mt-2">
            Design license plate
          </h1>
        </div>

        <LicensePlateDesigner backgroundUrl={plate.publicPath} fileName={plate.fileName} />
      </main>
    </div>
  )
}
