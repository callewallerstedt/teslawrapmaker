import VehicleSelector from '@/components/VehicleSelector'
import Navigation from '@/components/Navigation'

export default function DesignPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Navigation currentPath="/design" />

      <main className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-8">
        <VehicleSelector />
      </main>
    </div>
  )
}
