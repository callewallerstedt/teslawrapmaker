'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const vehicles = [
  {
    id: 'model3',
    name: 'Model 3',
    trims: [
      { id: 'model3', name: 'Standard', year: 'Old Version' },
      { id: 'model3-2024-base', name: 'Base', year: 'Highland' },
      { id: 'model3-2024-performance', name: 'Performance', year: 'Highland' }
    ]
  },
  {
    id: 'modely',
    name: 'Model Y',
    trims: [
      { id: 'modely', name: 'Pre-Refresh', year: 'Old Version' },
      { id: 'modely-2025-base', name: 'Base', year: 'Juniper' },
      { id: 'modely-2025-performance', name: 'Performance', year: 'Juniper' },
      { id: 'modely-2025-premium', name: 'Premium', year: 'Juniper' },
      { id: 'modely-l', name: 'L', year: 'Juniper' }
    ]
  },
  {
    id: 'cybertruck',
    name: 'Cybertruck',
    trims: [
      { id: 'cybertruck', name: 'Standard', year: '' }
    ]
  }
]

export default function VehicleSelector() {
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const router = useRouter()

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(vehicleId)
  }

  const handleTrimSelect = (trimId: string) => {
    router.push(`/design/${trimId}`)
  }

  const handleBack = () => {
    setSelectedVehicle(null)
  }

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle)

  return (
    <div className="max-w-4xl mx-auto">
      {!selectedVehicle ? (
        // Step 1: Select Vehicle Type
        <div>
          <h2 className="text-2xl font-semibold text-[#ededed] mb-8 text-center">Choose Your Vehicle</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                onClick={() => handleVehicleSelect(vehicle.id)}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 hover:border-[#3a3a3a] transition-all hover:scale-105 group"
              >
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-[#ededed] mb-3 group-hover:text-[#ffffff] transition-colors">
                    {vehicle.name}
                  </h3>
                  <p className="text-[#a0a0a0] text-sm">
                    {vehicle.trims.length} option{vehicle.trims.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        // Step 2: Select Trim Level
        <div>
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={handleBack}
              className="text-[#a0a0a0] hover:text-[#ededed] transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>

          <h2 className="text-2xl font-semibold text-[#ededed] mb-2 text-center">
            Select {selectedVehicleData?.name} Trim
          </h2>
          <p className="text-[#a0a0a0] text-center mb-8">
            Choose the specific model variant
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {selectedVehicleData?.trims.map((trim) => (
              <button
                key={trim.id}
                onClick={() => handleTrimSelect(trim.id)}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 hover:border-[#3a3a3a] transition-all hover:scale-105 text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#ededed] group-hover:text-[#ededed]">
                      {trim.name}
                    </h3>
                    <p className="text-[#a0a0a0] text-sm">
                      {trim.year}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-[#707070] group-hover:text-[#a0a0a0] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
