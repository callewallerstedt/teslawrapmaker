'use client'

import { Layer } from '@/lib/types'
import { useRef, useState } from 'react'

interface LayerSidebarProps {
  layers: Layer[]
  onLayerUpdate: (layerId: string, updates: Partial<Layer>) => void
  onLayerDelete: (layerId: string) => void
  onLayerAdd: (layer: Layer) => void
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
  onLayerAdd,
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
      
      // Load both images to calculate dimensions
      const uploadedImg = new Image()
      const templateImg = new Image()
      
      uploadedImg.src = url
      templateImg.src = baseTextureUrl
      
      // Wait for both images to load
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
      
      // Calculate scale to make uploaded image 50% of template size
      // The canvas scales the template to fit, so we need to account for that
      // Canvas size is 960x640, template is scaled to fit maintaining aspect ratio
      const canvasWidth = 960
      const canvasHeight = 640
      const templateWidth = templateImg.width
      const templateHeight = templateImg.height
      const templateScale = Math.min(canvasWidth / templateWidth, canvasHeight / templateHeight)
      
      // Template's displayed size on canvas
      const templateDisplayWidth = templateWidth * templateScale
      const templateDisplayHeight = templateHeight * templateScale
      
      // Target size: 50% of template display size
      const targetWidth = templateDisplayWidth * 0.5
      const targetHeight = templateDisplayHeight * 0.5
      
      // Calculate scale to maintain aspect ratio - use the smaller scale so image fits within 50%
      const uploadedWidth = uploadedImg.width
      const uploadedHeight = uploadedImg.height
      const scaleX = targetWidth / uploadedWidth
      const scaleY = targetHeight / uploadedHeight
      // Use the smaller scale to maintain aspect ratio and ensure image fits
      const scale = Math.min(scaleX, scaleY)
      
      // Center the image on the template
      const x = (canvasWidth - uploadedWidth * scale) / 2
      const y = (canvasHeight - uploadedHeight * scale) / 2
      
      const newLayer: Layer = {
        id: `layer-${Date.now()}`,
        imageUrl: url,
        x,
        y,
        scaleX: scale,
        scaleY: scale,
        rotation: 0,
        opacity: 1,
      }
      onLayerAdd(newLayer)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="w-56 bg-transparent border-r border-[#2a2a2a] flex flex-col">
      <div className="p-3 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-medium text-[#ededed] tracking-tight">Layers</h3>
        </div>
        
        {/* Base Color Picker */}
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

        {/* Mask toggle */}
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                onDragLeave={() => {
                  setDragOverIndex(null)
                }}
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
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-[#707070]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                    <div className="w-2 h-2 rounded-full bg-[#ededed]"></div>
                    <span className="text-xs font-medium text-[#ededed]">Layer {index + 1}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onLayerDelete(layer.id)
                    }}
                    className="text-[#707070] hover:text-[#ededed] text-sm font-bold w-5 h-5 flex items-center justify-center rounded hover:bg-[#ededed]/[0.12] transition-colors"
                    title="Delete layer"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-2">
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
                      onChange={(e) =>
                        onLayerUpdate(layer.id, { opacity: parseFloat(e.target.value) })
                      }
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

