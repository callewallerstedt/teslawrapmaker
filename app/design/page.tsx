import { getCarModels } from '@/lib/db'
import CarSelector from '@/components/CarSelector'
import Navigation from '@/components/Navigation'

export default async function DesignPage() {
  const models = await getCarModels()

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Navigation currentPath="/design" />

      <main className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-[#ededed] mb-3 tracking-tight">
            Design Your Dream Car Wrap
          </h1>
          <p className="text-base text-[#a0a0a0] max-w-2xl mx-auto font-light">
            Upload your images, position them on the UV map, and create your custom car wrap design.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-medium text-[#ededed] mb-4 text-center tracking-tight">
            Choose Your Vehicle
          </h2>
          <CarSelector models={models} />
        </div>
      </main>
    </div>
  )
}
