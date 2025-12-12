'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CarModel, Layer } from '@/lib/types'
import UVEditorCanvas from '@/components/UVEditorCanvas'
import LayerSidebar from '@/components/LayerSidebar'
import PublishModal from '@/components/PublishModal'

export default function DesignPage() {
  const params = useParams()
  const router = useRouter()
  const [carModel, setCarModel] = useState<CarModel | null>(null)
  const [layers, setLayers] = useState<Layer[]>([])
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [baseColor, setBaseColor] = useState<string | null>(null)
  const [maskEnabled, setMaskEnabled] = useState(false)

  useEffect(() => {
    async function loadModel() {
      const response = await fetch(`/api/car-models/${params.id}`)
      if (response.ok) {
        const model = await response.json()
        setCarModel(model)
      }
    }
    loadModel()
  }, [params.id])

  const handleLayerUpdate = (layerId: string, updates: Partial<Layer>) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.id === layerId ? { ...layer, ...updates } : layer))
    )
  }

  const handleLayerAdd = (layer: Layer) => {
    setLayers((prev) => [...prev, layer])
  }

  const handleLayerDelete = (layerId: string) => {
    setLayers((prev) => prev.filter((layer) => layer.id !== layerId))
  }

  const handleLayerReorder = (fromIndex: number, toIndex: number) => {
    setLayers((prev) => {
      const newLayers = [...prev]
      const [moved] = newLayers.splice(fromIndex, 1)
      newLayers.splice(toIndex, 0, moved)
      return newLayers
    })
  }

  const handleDownload = async () => {
    if (!carModel || layers.length === 0) return

    try {
      // Load template to get its dimensions
      const templateImg = new Image()
      templateImg.crossOrigin = 'anonymous'
      templateImg.src = carModel.uvTextureUrl
      
      await new Promise((resolve, reject) => {
        templateImg.onload = resolve
        templateImg.onerror = reject
      })

      const templateWidth = templateImg.width
      const templateHeight = templateImg.height

      // Create canvas at template resolution
      const canvas = document.createElement('canvas')
      canvas.width = templateWidth
      canvas.height = templateHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Draw base color first if provided (replace non-transparent template pixels)
      if (baseColor) {
        // Create a temporary canvas to process template with base color
        const baseCanvas = document.createElement('canvas')
        baseCanvas.width = templateWidth
        baseCanvas.height = templateHeight
        const baseCtx = baseCanvas.getContext('2d')
        if (baseCtx) {
          // Enable smoothing for smooth edges
          baseCtx.imageSmoothingEnabled = true
          if ('imageSmoothingQuality' in baseCtx) {
            (baseCtx as any).imageSmoothingQuality = 'high'
          }
          
          // Draw template
          baseCtx.drawImage(templateImg, 0, 0, templateWidth, templateHeight)
          
          // Get image data and replace non-transparent pixels with base color
          const imageData = baseCtx.getImageData(0, 0, templateWidth, templateHeight)
          const data = imageData.data
          
          // Convert hex color to RGB
          let hex = baseColor.replace('#', '')
          if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('')
          }
          const r = parseInt(hex.substring(0, 2), 16)
          const g = parseInt(hex.substring(2, 4), 16)
          const b = parseInt(hex.substring(4, 6), 16)
          
          // Use threshold to make base color pixels hard (no semi-transparency)
          const TH = 250 // tune: 240-254, higher = stricter (removes more edge pixels)
          
          for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3]
            if (a >= TH) {
              // Replace fully opaque pixels with base color (hard edges, no semi-transparency)
              data[i] = r
              data[i + 1] = g
              data[i + 2] = b
              data[i + 3] = 255
            } else {
              // Make semi-transparent edge pixels fully transparent
              data[i + 3] = 0
            }
          }
          
          baseCtx.putImageData(imageData, 0, 0)
          
          // Draw processed base color onto main canvas
          ctx.drawImage(baseCanvas, 0, 0, templateWidth, templateHeight)
        }
      } else {
        // Draw template as background if no base color
        ctx.drawImage(templateImg, 0, 0, templateWidth, templateHeight)
      }

      // Calculate scale factor from canvas display to template
      const canvasWidth = 960
      const canvasHeight = 640
      const canvasScale = Math.min(canvasWidth / templateWidth, canvasHeight / templateHeight)
      const templateDisplayWidth = templateWidth * canvasScale
      const templateDisplayHeight = templateHeight * canvasScale
      const templateOffsetX = (canvasWidth - templateDisplayWidth) / 2
      const templateOffsetY = (canvasHeight - templateDisplayHeight) / 2

      // Draw each layer with mask applied
      for (const layer of layers) {
        const layerImg = new Image()
        layerImg.crossOrigin = 'anonymous'
        layerImg.src = layer.imageUrl

        await new Promise((resolve, reject) => {
          layerImg.onload = resolve
          layerImg.onerror = reject
        })

        // Calculate position and scale in template coordinates
        const layerX = (layer.x - templateOffsetX) / canvasScale
        const layerY = (layer.y - templateOffsetY) / canvasScale
        const layerWidth = (layerImg.width * layer.scaleX) / canvasScale
        const layerHeight = (layerImg.height * layer.scaleY) / canvasScale

        // Create temporary canvas for this layer
        const layerCanvas = document.createElement('canvas')
        layerCanvas.width = templateWidth
        layerCanvas.height = templateHeight
        const layerCtx = layerCanvas.getContext('2d', { willReadFrequently: true })
        if (!layerCtx) continue

        // Draw layer with transformations
        layerCtx.save()
        layerCtx.globalAlpha = layer.opacity
        
        if (layer.rotation !== 0) {
          layerCtx.translate(layerX + layerWidth / 2, layerY + layerHeight / 2)
          layerCtx.rotate((layer.rotation * Math.PI) / 180)
          layerCtx.translate(-layerWidth / 2, -layerHeight / 2)
        } else {
          layerCtx.translate(layerX, layerY)
        }

        layerCtx.drawImage(layerImg, 0, 0, layerWidth, layerHeight)
        layerCtx.restore()

        // Apply mask using template alpha channel with proper compositing
        // First, draw the template to use as a mask
        layerCtx.save()
        layerCtx.globalCompositeOperation = 'destination-in'
        layerCtx.drawImage(templateImg, 0, 0, templateWidth, templateHeight)
        layerCtx.restore()

        // Composite masked layer onto main canvas
        ctx.save()
        ctx.globalCompositeOperation = 'source-over'
        ctx.drawImage(layerCanvas, 0, 0)
        ctx.restore()
      }

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${carModel.name}_wrap.png`
        a.click()
        URL.revokeObjectURL(url)
      }, 'image/png')
    } catch (error) {
      console.error('Failed to download:', error)
    }
  }

  const handlePublish = async (title: string, description: string, username: string) => {
    if (!carModel || layers.length === 0) return

    try {
      // Generate texture the same way as download
      const templateImg = new Image()
      templateImg.crossOrigin = 'anonymous'
      templateImg.src = carModel.uvTextureUrl
      
      await new Promise((resolve, reject) => {
        templateImg.onload = resolve
        templateImg.onerror = reject
      })

      const templateWidth = templateImg.width
      const templateHeight = templateImg.height

      const canvas = document.createElement('canvas')
      canvas.width = templateWidth
      canvas.height = templateHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Draw base color first if provided (replace non-transparent template pixels)
      if (baseColor) {
        // Create a temporary canvas to process template with base color
        const baseCanvas = document.createElement('canvas')
        baseCanvas.width = templateWidth
        baseCanvas.height = templateHeight
        const baseCtx = baseCanvas.getContext('2d')
        if (baseCtx) {
          // Enable smoothing for smooth edges
          baseCtx.imageSmoothingEnabled = true
          if ('imageSmoothingQuality' in baseCtx) {
            (baseCtx as any).imageSmoothingQuality = 'high'
          }
          
          // Draw template
          baseCtx.drawImage(templateImg, 0, 0, templateWidth, templateHeight)
          
          // Get image data and replace non-transparent pixels with base color
          const imageData = baseCtx.getImageData(0, 0, templateWidth, templateHeight)
          const data = imageData.data
          
          // Convert hex color to RGB
          let hex = baseColor.replace('#', '')
          if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('')
          }
          const r = parseInt(hex.substring(0, 2), 16)
          const g = parseInt(hex.substring(2, 4), 16)
          const b = parseInt(hex.substring(4, 6), 16)
          
          // Use threshold to make base color pixels hard (no semi-transparency)
          const TH = 250 // tune: 240-254, higher = stricter (removes more edge pixels)
          
          for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3]
            if (a >= TH) {
              // Replace fully opaque pixels with base color (hard edges, no semi-transparency)
              data[i] = r
              data[i + 1] = g
              data[i + 2] = b
              data[i + 3] = 255
            } else {
              // Make semi-transparent edge pixels fully transparent
              data[i + 3] = 0
            }
          }
          
          baseCtx.putImageData(imageData, 0, 0)
          
          // Draw processed base color onto main canvas
          ctx.drawImage(baseCanvas, 0, 0, templateWidth, templateHeight)
        }
      } else {
        // Draw template as background if no base color
        ctx.drawImage(templateImg, 0, 0, templateWidth, templateHeight)
      }

      const canvasWidth = 960
      const canvasHeight = 640
      const canvasScale = Math.min(canvasWidth / templateWidth, canvasHeight / templateHeight)
      const templateDisplayWidth = templateWidth * canvasScale
      const templateDisplayHeight = templateHeight * canvasScale
      const templateOffsetX = (canvasWidth - templateDisplayWidth) / 2
      const templateOffsetY = (canvasHeight - templateDisplayHeight) / 2

      for (const layer of layers) {
        const layerImg = new Image()
        layerImg.crossOrigin = 'anonymous'
        layerImg.src = layer.imageUrl

        await new Promise((resolve, reject) => {
          layerImg.onload = resolve
          layerImg.onerror = reject
        })

        const layerX = (layer.x - templateOffsetX) / canvasScale
        const layerY = (layer.y - templateOffsetY) / canvasScale
        const layerWidth = (layerImg.width * layer.scaleX) / canvasScale
        const layerHeight = (layerImg.height * layer.scaleY) / canvasScale

        const layerCanvas = document.createElement('canvas')
        layerCanvas.width = templateWidth
        layerCanvas.height = templateHeight
        const layerCtx = layerCanvas.getContext('2d', { willReadFrequently: true })
        if (!layerCtx) continue

        layerCtx.save()
        layerCtx.globalAlpha = layer.opacity
        
        if (layer.rotation !== 0) {
          layerCtx.translate(layerX + layerWidth / 2, layerY + layerHeight / 2)
          layerCtx.rotate((layer.rotation * Math.PI) / 180)
          layerCtx.translate(-layerWidth / 2, -layerHeight / 2)
        } else {
          layerCtx.translate(layerX, layerY)
        }

        layerCtx.drawImage(layerImg, 0, 0, layerWidth, layerHeight)
        layerCtx.restore()

        // Apply mask using template alpha channel with proper compositing
        layerCtx.save()
        layerCtx.globalCompositeOperation = 'destination-in'
        layerCtx.drawImage(templateImg, 0, 0, templateWidth, templateHeight)
        layerCtx.restore()

        ctx.save()
        ctx.globalCompositeOperation = 'source-over'
        ctx.drawImage(layerCanvas, 0, 0)
        ctx.restore()
      }

      const formData = new FormData()
      formData.append('title', title)
      formData.append('carModelId', carModel.id)
      formData.append('description', description)
      formData.append('username', username)
      
      // Convert canvas to blob
      const textureBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob || new Blob())
        }, 'image/png')
      })
      formData.append('texture', textureBlob, 'texture.png')

      const response = await fetch('/api/publish', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const wrap = await response.json()
        router.push(`/wrap/${wrap.id}`)
      }
    } catch (error) {
      console.error('Failed to publish:', error)
    }
  }

  if (!carModel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading model...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <nav className="border-b border-[#2a2a2a] bg-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-xl font-semibold text-[#ededed] hover:text-[#ededed] transition-colors tracking-tight"
              >
                TeslaWrapMaker
              </button>
              <button
                onClick={() => router.push('/explore')}
                className="text-sm text-[#a0a0a0] hover:text-[#ededed] transition-colors font-medium"
              >
                Explore
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-sm font-medium text-[#ededed] rounded border border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a] transition-all"
              >
                Create Your Own Wrap
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-4rem)]">
        <LayerSidebar
          layers={layers}
          onLayerUpdate={handleLayerUpdate}
          onLayerDelete={handleLayerDelete}
          onLayerAdd={handleLayerAdd}
          onLayerReorder={handleLayerReorder}
          baseTextureUrl={carModel?.uvTextureUrl || ''}
          baseColor={baseColor}
          onBaseColorChange={setBaseColor}
          maskEnabled={maskEnabled}
          onMaskToggle={setMaskEnabled}
        />

        <div className="flex-1 flex flex-col p-2 gap-2">
          <div className="flex-1">
            <div className="bg-transparent rounded border border-[#2a2a2a] p-2 h-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-[#ededed] tracking-tight">UV Map Editor</h3>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={handleDownload}
                    disabled={layers.length === 0}
                    className="px-3 py-1.5 text-sm font-medium text-[#ededed] rounded border border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={() => setIsPublishModalOpen(true)}
                    disabled={layers.length === 0}
                    className="px-3 py-1.5 text-sm font-medium text-[#ededed] rounded border border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Publish
                  </button>
                </div>
              </div>
              <UVEditorCanvas
                baseTextureUrl={carModel.uvTextureUrl}
                layers={layers}
                onLayerUpdate={handleLayerUpdate}
                onLayerAdd={handleLayerAdd}
                onLayerDelete={handleLayerDelete}
                baseColor={baseColor}
                maskEnabled={maskEnabled}
              />
            </div>
          </div>
        </div>
      </div>

      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPublish={handlePublish}
      />
    </div>
  )
}

