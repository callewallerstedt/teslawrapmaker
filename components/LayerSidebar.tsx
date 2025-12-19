'use client'

import { Layer } from '@/lib/types'
import { useRef, useState } from 'react'

interface LayerSidebarProps {
  layers: Layer[]
  onLayerUpdate: (layerId: string, updates: Partial<Layer>) => void
  onLayerDelete: (layerId: string) => void
  onLayerDuplicate?: (layerId: string) => void
  onLayerMirror?: (layerId: string) => void
  onLayerCrop?: (layerId: string) => void
  onLayerSelect?: (layerId: string) => void
  onLayerAdd: (layer: Layer) => void
  onAddImageUrl?: (imageUrl: string) => void | Promise<void>
  onLayerReorder: (fromIndex: number, toIndex: number) => void
  baseTextureUrl: string
  baseColor: string | null
  onBaseColorChange: (color: string | null) => void
  maskEnabled: boolean
  onMaskToggle: (enabled: boolean) => void
}

export default function LayerSidebar({
  layers,
  onLayerUpdate,
  onLayerDelete,
  onLayerDuplicate,
  onLayerMirror,
  onLayerCrop,
  onLayerSelect,
  onLayerAdd,
  onAddImageUrl,
  onLayerReorder,
  baseTextureUrl,
  baseColor,
  onBaseColorChange,
  maskEnabled,
  onMaskToggle,
}: LayerSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const url = event.target?.result as string

      if (onAddImageUrl) {
        await onAddImageUrl(url)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      const uploadedImg = new Image()
      const templateImg = new Image()

      uploadedImg.src = url
      templateImg.src = baseTextureUrl

      await Promise.all([
        new Promise((resolve) => {
          uploadedImg.onload = resolve
          if (uploadedImg.complete) resolve(undefined)
        }),
        new Promise((resolve) => {
          templateImg.onload = resolve
          if (templateImg.complete) resolve(undefined)
        }),
      ])

      const canvasWidth = 960
      const canvasHeight = 640
      const templateWidth = templateImg.width
      const templateHeight = templateImg.height
      const templateScale = Math.min(canvasWidth / templateWidth, canvasHeight / templateHeight)

      const templateDisplayWidth = templateWidth * templateScale
      const templateDisplayHeight = templateHeight * templateScale

      const uploadedWidth = uploadedImg.width
      const uploadedHeight = uploadedImg.height

      const shouldKeepTemplateSize =
        (uploadedWidth === templateWidth && uploadedHeight === templateHeight) ||
        (uploadedWidth === 1024 && uploadedHeight === 1024)

      let scale: number
      if (shouldKeepTemplateSize) {
        scale = templateScale
      } else {
        const targetWidth = templateDisplayWidth * 0.5
        const targetHeight = templateDisplayHeight * 0.5
        const scaleX = targetWidth / uploadedWidth
        const scaleY = targetHeight / uploadedHeight
        scale = Math.min(scaleX, scaleY)
      }

      // Center in the editor (UVEditorCanvas uses originX/Y: 'center')
      const x = canvasWidth / 2
      const y = canvasHeight / 2

      const newLayer: Layer = {
        id: `layer-${Date.now()}`,
        imageUrl: url,
        x,
        y,
        scaleX: scale,
        scaleY: scale,
        rotation: 0,
        opacity: 1,
        recolor: null,
        totalRecolor: false,
        flipX: false,
        flipY: false,
        crop: null,
      }
      onLayerAdd(newLayer)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="w-full md:w-56 bg-transparent border-b md:border-b-0 md:border-r border-[#2a2a2a] flex flex-col md:h-full overflow-hidden md:overflow-visible max-h-[45dvh] md:max-h-none">
      <div className="p-3 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-medium text-[#ededed] tracking-tight">Layers</h3>
        </div>

        <div className="mb-3">
          <label className="text-xs text-[#a0a0a0] font-light mb-1.5 block">Base Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={baseColor || '#ffffff'}
              onChange={(e) => onBaseColorChange(e.target.value)}
              className="w-10 h-8 rounded border border-[#2a2a2a] bg-[#1a1a1a] cursor-pointer"
            />
            <button
              onClick={() => onBaseColorChange(null)}
              className="px-2 py-1 text-xs text-[#a0a0a0] hover:text-[#ededed] rounded border border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] transition-all"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mb-3">
          <label className="flex items-center gap-2 text-sm text-[#ededed] cursor-pointer hover:text-[#ededed] transition-colors">
            <input
              type="checkbox"
              checked={maskEnabled}
              onChange={(e) => onMaskToggle(e.target.checked)}
              className="w-4 h-4 text-[#ededed] bg-transparent border-[#2a2a2a] rounded focus:ring-[#ededed] focus:ring-1"
            />
            <span className="font-medium">Enable Mask</span>
          </label>
        </div>

        <label className="block w-full">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-3 py-2 text-sm font-medium text-[#ededed] rounded border border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Image
          </button>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {layers.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-[#707070] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-[#a0a0a0] text-xs font-light">No layers yet</p>
            <p className="text-[#707070] text-xs mt-1 font-light">Upload an image to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {layers.map((layer, index) => (
              <div
                key={layer.id}
                draggable
                onClick={() => onLayerSelect?.(layer.id)}
                onDragStart={(e) => {
                  setDraggedIndex(index)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (draggedIndex !== null && draggedIndex !== index) {
                    setDragOverIndex(index)
                  }
                }}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (draggedIndex !== null && draggedIndex !== index) {
                    onLayerReorder(draggedIndex, index)
                  }
                  setDraggedIndex(null)
                  setDragOverIndex(null)
                }}
                className={`border rounded p-2.5 bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] transition-all cursor-move ${
                  dragOverIndex === index ? 'border-[#3a3a3a] bg-[#ededed]/[0.18]' : 'border-[#2a2a2a]'
                } ${draggedIndex === index ? 'opacity-50' : ''}`}
              >
                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-[#707070]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                    <div className="w-2 h-2 rounded-full bg-[#ededed]" />
                    <span className="text-xs font-medium text-[#ededed]">Layer {index + 1}</span>
                  </div>

                  <div className="flex items-center justify-end gap-1 mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onLayerMirror?.(layer.id)
                      }}
                      disabled={!onLayerMirror}
                      className="text-[#707070] hover:text-[#ededed] text-xs font-bold w-6 h-6 flex items-center justify-center rounded hover:bg-[#ededed]/[0.12] transition-colors disabled:opacity-50"
                      title="Mirror over center (duplicate)"
                    >
                      ⇋
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onLayerCrop?.(layer.id)
                      }}
                      disabled={!onLayerCrop}
                      className="text-[#707070] hover:text-[#ededed] text-xs font-bold w-6 h-6 flex items-center justify-center rounded hover:bg-[#ededed]/[0.12] transition-colors disabled:opacity-50"
                      title="Crop layer"
                    >
                      <svg
                        className="w-4 h-4"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                        <path d="M2 6h14a2 2 0 0 1 2 2v14" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onLayerUpdate(layer.id, { flipX: !layer.flipX })
                      }}
                      className="text-[#707070] hover:text-[#ededed] text-xs font-bold w-6 h-6 flex items-center justify-center rounded hover:bg-[#ededed]/[0.12] transition-colors"
                      title="Flip horizontally"
                    >
                      <svg
                        className={`w-4 h-4 ${layer.flipX ? 'text-[#ededed]' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l-4 5 4 5M16 7l4 5-4 5M12 5v14" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onLayerUpdate(layer.id, { flipY: !layer.flipY })
                      }}
                      className="text-[#707070] hover:text-[#ededed] text-xs font-bold w-6 h-6 flex items-center justify-center rounded hover:bg-[#ededed]/[0.12] transition-colors"
                      title="Flip vertically"
                    >
                      <svg
                        className={`w-4 h-4 ${layer.flipY ? 'text-[#ededed]' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8l5-4 5 4M7 16l5 4 5-4M5 12h14" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onLayerDuplicate?.(layer.id)
                      }}
                      disabled={!onLayerDuplicate}
                      className="text-[#707070] hover:text-[#ededed] text-xs font-bold w-6 h-6 flex items-center justify-center rounded hover:bg-[#ededed]/[0.12] transition-colors disabled:opacity-50"
                      title="Duplicate layer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7a2 2 0 012-2h7a2 2 0 012 2v7a2 2 0 01-2 2h-7a2 2 0 01-2-2V7z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17H9a2 2 0 01-2-2V8" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onLayerDelete(layer.id)
                      }}
                      className="text-[#707070] hover:text-[#ededed] text-sm font-bold w-6 h-6 flex items-center justify-center rounded hover:bg-[#ededed]/[0.12] transition-colors"
                      title="Delete layer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3m-4 0h14" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                      <img src={layer.imageUrl} alt={`Layer ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] text-[#a0a0a0] truncate">
                      {layer.imageUrl.startsWith('data:') ? 'Pasted / uploaded image' : layer.imageUrl}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-[#a0a0a0] font-light">Layer Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={layer.recolor || '#ffffff'}
                        onChange={(e) => onLayerUpdate(layer.id, { recolor: e.target.value })}
                        className="w-10 h-7 rounded border border-[#2a2a2a] bg-[#1a1a1a] cursor-pointer"
                      />
                      <button
                        onClick={() => onLayerUpdate(layer.id, { recolor: null, totalRecolor: false })}
                        className="px-2 py-1 text-xs text-[#a0a0a0] hover:text-[#ededed] rounded border border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] transition-all"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-[#ededed] cursor-pointer hover:text-[#ededed] transition-colors">
                    <input
                      type="checkbox"
                      checked={!!layer.totalRecolor}
                      onChange={(e) => onLayerUpdate(layer.id, { totalRecolor: e.target.checked })}
                      disabled={!layer.recolor}
                      className="w-4 h-4 text-[#ededed] bg-transparent border-[#2a2a2a] rounded focus:ring-[#ededed] focus:ring-1 disabled:opacity-50"
                    />
                    <span className={`font-medium ${!layer.recolor ? 'text-[#707070]' : ''}`}>Total re color</span>
                  </label>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-[#a0a0a0] font-light">Opacity</label>
                      <span className="text-xs text-[#707070] font-light">{Math.round(layer.opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={layer.opacity}
                      onChange={(e) => onLayerUpdate(layer.id, { opacity: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-[#1a1a1a] rounded appearance-none cursor-pointer accent-[#ededed]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
