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
      const templateImg = new Image()
      templateImg.crossOrigin = 'anonymous'
      templateImg.src = carModel.uvTextureUrl
      
      await new Promise((resolve, reject) => {
        templateImg.onload = resolve
        templateImg.onerror = reject
      })

      const templateWidth = templateImg.width || 1024
      const templateHeight = templateImg.height || 1024

      // Render at original template resolution (e.g. 1024x1024)
      const canvas = document.createElement('canvas')
      canvas.width = templateWidth
      canvas.height = templateHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.imageSmoothingEnabled = true
      if ('imageSmoothingQuality' in ctx) {
        // @ts-ignore
        ctx.imageSmoothingQuality = 'high'
      }

      // Draw base: either template tinted with base color, or raw template
      if (baseColor) {
        ctx.save()
        ctx.fillStyle = baseColor
        ctx.fillRect(0, 0, templateWidth, templateHeight)
        ctx.globalCompositeOperation = 'destination-in'
        ctx.drawImage(templateImg, 0, 0, templateWidth, templateHeight)
        ctx.restore()
      } else {
        ctx.drawImage(templateImg, 0, 0, templateWidth, templateHeight)
      }

      // Map from editor canvas (960x640) coordinates to template coordinates
      const editorWidth = 960
      const editorHeight = 640
      const scale = Math.min(editorWidth / templateWidth, editorHeight / templateHeight)
      const displayWidth = templateWidth * scale
      const displayHeight = templateHeight * scale
      const offsetX = (editorWidth - displayWidth) / 2
      const offsetY = (editorHeight - displayHeight) / 2

      for (const layer of layers) {
        const layerImg = new Image()
        layerImg.crossOrigin = 'anonymous'
        layerImg.src = layer.imageUrl

        await new Promise((resolve, reject) => {
          layerImg.onload = resolve
          layerImg.onerror = reject
        })

        // layer.x / layer.y are the CENTER coordinates in editor space (originX/Y: 'center')
        const centerX = (layer.x - offsetX) / scale
        const centerY = (layer.y - offsetY) / scale
        const drawWidth = (layerImg.width * layer.scaleX) / scale
        const drawHeight = (layerImg.height * layer.scaleY) / scale

        ctx.save()
        ctx.globalAlpha = layer.opacity

        // Translate to center, apply rotation, then draw image centered
        ctx.translate(centerX, centerY)
        if (layer.rotation !== 0) {
          ctx.rotate((layer.rotation * Math.PI) / 180)
        }
        ctx.drawImage(layerImg, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
        ctx.restore()
      }

      // Final crop to template alpha to match original UV mask
      ctx.save()
      ctx.globalCompositeOperation = 'destination-in'
      ctx.drawImage(templateImg, 0, 0, templateWidth, templateHeight)
      ctx.restore()

      const dataUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${carModel.name}_wrap.png`
      a.click()
    } catch (error) {
      console.error('Failed to download:', error)
    }
  }

  const handlePublish = async (title: string, description: string, username: string) => {
    if (!carModel || layers.length === 0) return

    try {
      const templateImg = new Image()
      templateImg.crossOrigin = 'anonymous'
      templateImg.src = carModel.uvTextureUrl
      
      await new Promise((resolve, reject) => {
        templateImg.onload = resolve
        templateImg.onerror = reject
      })

      const templateWidth = templateImg.width || 1024
      const templateHeight = templateImg.height || 1024

      const canvas = document.createElement('canvas')
      canvas.width = templateWidth
      canvas.height = templateHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.imageSmoothingEnabled = true
      if ('imageSmoothingQuality' in ctx) {
        // @ts-ignore
        ctx.imageSmoothingQuality = 'high'
      }

      if (baseColor) {
        ctx.save()
        ctx.fillStyle = baseColor
        ctx.fillRect(0, 0, templateWidth, templateHeight)
        ctx.globalCompositeOperation = 'destination-in'
        ctx.drawImage(templateImg, 0, 0, templateWidth, templateHeight)
        ctx.restore()
      } else {
        ctx.drawImage(templateImg, 0, 0, templateWidth, templateHeight)
      }

      const editorWidth = 960
      const editorHeight = 640
      const scale = Math.min(editorWidth / templateWidth, editorHeight / templateHeight)
      const displayWidth = templateWidth * scale
      const displayHeight = templateHeight * scale
      const offsetX = (editorWidth - displayWidth) / 2
      const offsetY = (editorHeight - displayHeight) / 2

      for (const layer of layers) {
        const layerImg = new Image()
        layerImg.crossOrigin = 'anonymous'
        layerImg.src = layer.imageUrl

        await new Promise((resolve, reject) => {
          layerImg.onload = resolve
          layerImg.onerror = reject
        })

        const centerX = (layer.x - offsetX) / scale
        const centerY = (layer.y - offsetY) / scale
        const drawWidth = (layerImg.width * layer.scaleX) / scale
        const drawHeight = (layerImg.height * layer.scaleY) / scale

        ctx.save()
        ctx.globalAlpha = layer.opacity

        ctx.translate(centerX, centerY)
        if (layer.rotation !== 0) {
          ctx.rotate((layer.rotation * Math.PI) / 180)
        }
        ctx.drawImage(layerImg, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
        ctx.restore()
      }

      ctx.save()
      ctx.globalCompositeOperation = 'destination-in'
      ctx.drawImage(templateImg, 0, 0, templateWidth, templateHeight)
      ctx.restore()

      const dataUrl = canvas.toDataURL('image/png')

      const formData = new FormData()
      formData.append('title', title)
      formData.append('carModelId', carModel.id)
      formData.append('description', description)
      formData.append('username', username)
      
      // Convert canvas to blob
      const textureBlob = await new Promise<Blob>((resolve) => {
        fetch(dataUrl)
          .then((res) => res.blob())
          .then((blob) => resolve(blob))
          .catch(() => resolve(new Blob()))
      })
      formData.append('texture', textureBlob, 'texture.png')

      const response = await fetch('/api/publish', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const wrap = await response.json()
        if (typeof window !== 'undefined') {
          window.alert('Wrap published! Redirecting to your wrap.')
        }
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
