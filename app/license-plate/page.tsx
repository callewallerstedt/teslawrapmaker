import Link from 'next/link'
import Navigation from '@/components/Navigation'
import LiquidBackground from '@/components/LiquidBackground'
import { listLicensePlates } from '@/lib/licensePlates'

export default async function LicensePlatePickerPage() {
  const plates = await listLicensePlates()

  return (
    <div className="min-h-screen bg-[#1a1a1a] relative flex flex-col" style={{ minHeight: '100dvh' }}>
      <LiquidBackground opacity={0.5} />
      <Navigation currentPath="/license-plate" />

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 flex-1 py-8 min-h-0 w-full">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#ededed]/90">License plates</h1>
            <p className="text-sm text-[#a0a0a0] mt-1">Pick a plate template to start designing (420×100).</p>
          </div>
        </div>

        {plates.length === 0 ? (
          <div className="rounded-lg border border-[#2a2a2a] bg-[#111] p-6 text-[#a0a0a0]">
            No images found in `public/LicensePlates`.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plates.map((plate) => (
              <Link
                key={plate.fileName}
                href={`/license-plate/${plate.slug}`}
                className="group rounded-xl border border-[#2a2a2a] bg-[#111] hover:bg-[#151515] transition-colors overflow-hidden"
              >
                <div className="p-4">
                  <div className="text-sm font-medium text-[#ededed] mb-2 truncate">{plate.displayName}</div>
                  <div className="rounded-md bg-[#0b0b0b] border border-[#2a2a2a] overflow-hidden">
                    <img
                      src={plate.publicPath}
                      alt={plate.displayName}
                      width={420}
                      height={100}
                      className="w-full h-auto block"
                      style={{ aspectRatio: '420 / 100' }}
                    />
                  </div>
                  <div className="mt-3 text-xs text-[#a0a0a0] group-hover:text-[#ededed] transition-colors">
                    Select →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
