'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CarModel, Layer } from '@/lib/types'
import UVEditorCanvas, { UVEditorCanvasHandle } from '@/components/UVEditorCanvas'
import LayerSidebar from '@/components/LayerSidebar'
import PublishModal from '@/components/PublishModal'
import Navigation from '@/components/Navigation'

export default function DesignPage() {
  const params = useParams()
  const router = useRouter()
  const [carModel, setCarModel] = useState<CarModel | null>(null)
  const [layers, setLayers] = useState<Layer[]>([])
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [showDonationModal, setShowDonationModal] = useState(false)
  const [baseColor, setBaseColor] = useState<string | null>(null)
  const [maskEnabled, setMaskEnabled] = useState(false)
  const editorRef = useRef<UVEditorCanvasHandle>(null)

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
    if (!carModel) return

    try {
      const dataUrl = editorRef.current?.exportImage()
      if (!dataUrl) {
        throw new Error('Editor is not ready to export yet.')
      }
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${carModel.name}_wrap.png`
      a.click()

      // Show donation modal after download starts
      setShowDonationModal(true)
    } catch (error) {
      console.error('Failed to download:', error)
    }
  }

  const handlePublish = async (title: string, description: string, username: string) => {
    if (!carModel || layers.length === 0) return

    try {
      const dataUrl = editorRef.current?.exportImage()
      if (!dataUrl) {
        throw new Error('Editor is not ready to export yet.')
      }

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
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-[#ededed] mx-auto mb-4"></div>
          <p className="text-[#a0a0a0]">Loading model...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Navigation currentPath="/design" />

      <div className="flex flex-col md:flex-row md:h-[calc(100dvh-3rem)] min-h-[calc(100dvh-3rem)]">
        <LayerSidebar
          layers={layers}
          onLayerUpdate={handleLayerUpdate}
          onLayerDelete={handleLayerDelete}
          onLayerAdd={handleLayerAdd}
          onAddImageUrl={(imageUrl) => editorRef.current?.addImageLayer(imageUrl)}
          onLayerReorder={handleLayerReorder}
          baseTextureUrl={carModel?.uvTextureUrl || ''}
          baseColor={baseColor}
          onBaseColorChange={setBaseColor}
          maskEnabled={maskEnabled}
          onMaskToggle={setMaskEnabled}
        />

        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col m-2 sm:m-4 min-h-[50dvh] md:min-h-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border-b border-[#2a2a2a] flex-shrink-0">
              <h3 className="text-sm font-medium text-[#ededed] tracking-tight">UV Map Editor</h3>
              <div className="flex flex-wrap gap-2 items-center justify-start sm:justify-end">
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 text-sm font-medium text-[#ededed] rounded border border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a] transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => setIsPublishModalOpen(true)}
                  className="px-3 py-1.5 text-sm font-medium text-[#ededed] rounded border border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a] transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Publish
                </button>
              </div>
            </div>
            <div className="flex-1 p-2 overflow-hidden">
              <UVEditorCanvas
                ref={editorRef}
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

      {/* Donation Modal */}
      {showDonationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="mb-4">
                <svg className="w-12 h-12 mx-auto text-[#ededed] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#ededed] mb-3">Your download has started!</h3>
              <p className="text-sm text-[#a0a0a0] mb-4 leading-relaxed">
                EvWrapStudio is completely free and will always remain free. However, maintaining and improving the platform takes time and resources. If you'd like to support the project, every contribution no matter how small is appreciated!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDonationModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-[#a0a0a0] rounded border border-[#2a2a2a] bg-transparent hover:bg-[#ededed]/[0.05] transition-all"
              >
                No Thanks
              </button>
              <button
                onClick={() => {
                  window.open('https://www.paypal.com/donate?hosted_button_id=N8EMZTSSPYP6L', '_blank')
                  setShowDonationModal(false)
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-[#1a1a1a] rounded border border-[#ededed] bg-[#ededed] hover:bg-[#ededed]/90 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                Support Me
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
