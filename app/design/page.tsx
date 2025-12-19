import VehicleSelector from '@/components/VehicleSelector'
import Navigation from '@/components/Navigation'
import LiquidBackground from '@/components/LiquidBackground'

export default function DesignPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] relative">
      <LiquidBackground opacity={0.5} />
      <Navigation currentPath="/design" />

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-8">
        <VehicleSelector />
      </main>
    </div>
  )
}
