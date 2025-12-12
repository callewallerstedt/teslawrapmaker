import Link from 'next/link'
import Navigation from '@/components/Navigation'

const scrollAnimation = `
  @keyframes scrollBackground {
    0% {
      background-position: 0% center, 33.33% center, 66.67% center, 100% center, 133.33% center, 166.67% center;
    }
    100% {
      background-position: -100% center, -66.67% center, -33.33% center, 0% center, 33.33% center, 66.67% center;
    }
  }
`

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] relative">
      {/* Scrolling background images with low opacity - starts below header */}
      <div className="scrolling-container absolute left-0 right-0 top-12 bottom-0 opacity-5 overflow-hidden">
        <div className="scrolling-content flex">
          <img src="/model3-2024-performance/vehicle_image.png" alt="Model 3" className="vehicle-image" />
          <img src="/modely-2025-performance/vehicle_image.png" alt="Model Y" className="vehicle-image" />
          <img src="/cybertruck/vehicle_image.png" alt="Cybertruck" className="vehicle-image" />
          <img src="/model3-2024-performance/vehicle_image.png" alt="Model 3" className="vehicle-image" />
          <img src="/modely-2025-performance/vehicle_image.png" alt="Model Y" className="vehicle-image" />
          <img src="/cybertruck/vehicle_image.png" alt="Cybertruck" className="vehicle-image" />
          <img src="/model3-2024-performance/vehicle_image.png" alt="Model 3" className="vehicle-image" />
          <img src="/modely-2025-performance/vehicle_image.png" alt="Model Y" className="vehicle-image" />
          <img src="/cybertruck/vehicle_image.png" alt="Cybertruck" className="vehicle-image" />
          <img src="/model3-2024-performance/vehicle_image.png" alt="Model 3" className="vehicle-image" />
          <img src="/modely-2025-performance/vehicle_image.png" alt="Model Y" className="vehicle-image" />
          <img src="/cybertruck/vehicle_image.png" alt="Cybertruck" className="vehicle-image" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .scrolling-container {
            display: flex;
            align-items: stretch;
          }

          .scrolling-content {
            animation: scrollLeft 50s linear infinite;
            display: flex;
            height: 100%;
            width: calc(100vh - 48px); /* Full height minus header */
          }

          .vehicle-image {
            height: 100%;
            width: auto;
            object-fit: contain;
            object-position: center;
            flex-shrink: 0;
            display: block;
          }

          @keyframes scrollLeft {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-2100px);
            }
          }
        `
      }} />
      <Navigation currentPath="/" />

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-semibold text-[#ededed] mb-6 tracking-tight" style={{ fontFamily: 'Anton, sans-serif', letterSpacing: '0.05em' }}>
            TeslaWrapMaker
          </h1>
          <p className="text-xl text-[#a0a0a0] max-w-2xl mx-auto mb-12 font-light">
            Design and explore custom Tesla car wraps. Upload your designs, position them perfectly, and create stunning vehicle transformations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Link
              href="/explore"
              className="px-8 py-4 text-lg font-medium text-[#ededed] rounded-lg border-2 border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a] transition-all transform hover:scale-105"
            >
              Explore Wraps
            </Link>
            <Link
              href="/design"
              className="px-8 py-4 text-lg font-medium text-[#1a1a1a] rounded-lg border-2 border-[#ededed] bg-[#ededed] hover:bg-[#ededed]/90 transition-all transform hover:scale-105"
            >
              Create Your Own
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

