import VehicleSelector from '@/components/VehicleSelector'
import Navigation from '@/components/Navigation'

export default function DesignPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Navigation currentPath="/design" />

      <main className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-[#ededed] mb-3 tracking-tight">
            Design Your Dream EV Wrap
          </h1>
          <p className="text-base text-[#a0a0a0] max-w-2xl mx-auto font-light">
            Upload your designs, position them perfectly, and create stunning electric vehicle transformations.
          </p>
        </div>

        <VehicleSelector />
      </main>
    </div>
  )
}
