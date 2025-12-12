'use client'

import { CarModel } from '@/lib/types'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface CarSelectorProps {
  models: CarModel[]
}

export default function CarSelector({ models }: CarSelectorProps) {
  const router = useRouter()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {models.map((model) => (
        <button
          key={model.id}
          onClick={() => router.push(`/design/${model.id}`)}
          className="group relative overflow-hidden rounded transition-all duration-300 hover:bg-[#ededed]/[0.05]"
        >
          <div className="aspect-[16/11] relative bg-[#1a1a1a] overflow-hidden rounded flex items-center justify-center">
            <Image
              src={model.previewImage}
              alt={model.name}
              width={800}
              height={450}
              className="w-full h-auto group-hover:scale-105 transition-transform duration-300 object-contain"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </div>
          <div className="mt-3 px-1">
            <h3 className="text-base font-medium text-[#ededed] group-hover:text-[#ededed] transition-colors tracking-tight text-center">
              {model.name}
            </h3>
          </div>
        </button>
      ))}
    </div>
  )
}

