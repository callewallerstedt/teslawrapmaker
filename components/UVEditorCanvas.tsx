'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import { Layer } from '@/lib/types'

interface UVEditorCanvasProps {
  baseTextureUrl: string
  layers: Layer[]
  onLayerUpdate: (layerId: string, updates: Partial<Layer>) => void
  onLayerAdd: (layer: Layer) => void
  onLayerDelete: (layerId: string) => void
  baseColor?: string | null // Base color for the template (hex color or null)
  maskEnabled: boolean
}

export default function UVEditorCanvas({
  baseTextureUrl,
  layers,
  onLayerUpdate,
  onLayerAdd,
  onLayerDelete,
  baseColor,
  maskEnabled,
}: UVEditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const templateOverlayRef = useRef<fabric.Image | null>(null)
  const layerObjectsRef = useRef<Map<string, fabric.Image>>(new Map())
  const baseColorObjectRef = useRef<fabric.Image | null>(null) // Base color image (processed template)
  const [isDragging, setIsDragging] = useState(false)
  const centerGuideLineRef = useRef<fabric.Line | null>(null) // Center guide line

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 960,
      height: 640,
      backgroundColor: 'transparent',
      enableRetinaScaling: true, // Enable retina/high-DPI support
    })

    fabricCanvasRef.current = canvas

    // Enable image smoothing for better quality rendering
    const ctx = canvas.getContext()
    if (ctx) {
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
    }

    // Set dark background (transparency will show as dark)
    canvas.backgroundColor = '#1a1a1a'

    // Load base texture for background and scale to fit
    fabric.Image.fromURL(baseTextureUrl, (img) => {
      if (img && canvas && canvas.getContext()) {
        // Scale image to fit canvas while maintaining aspect ratio
        const canvasWidth = canvas.getWidth()
        const canvasHeight = canvas.getHeight()
        const imgWidth = img.width || 1
        const imgHeight = img.height || 1
        const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight)
        
        img.set({
          left: (canvasWidth - imgWidth * scale) / 2,
          top: (canvasHeight - imgHeight * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
        })
        try {
          canvas.setBackgroundImage(img, () => {
            if (canvas && canvas.getContext()) {
              canvas.renderAll()
            }
          })
        } catch (error) {
          console.error('Error setting background image:', error)
        }
      }
    }, {
      crossOrigin: 'anonymous'
    })

    // Load base texture separately for overlay masking
    fabric.Image.fromURL(baseTextureUrl, (overlayImg) => {
      if (overlayImg) {
        const canvasWidth = canvas.getWidth()
        const canvasHeight = canvas.getHeight()
        const imgWidth = overlayImg.width || 1
        const imgHeight = overlayImg.height || 1
        const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight)
        
        overlayImg.set({
          left: (canvasWidth - imgWidth * scale) / 2,
          top: (canvasHeight - imgHeight * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
        })
        templateOverlayRef.current = overlayImg
      }
    }, {
      crossOrigin: 'anonymous'
    })

    // Disable object caching globally to reduce pixelation on transforms
    fabric.Object.prototype.objectCaching = false

    // Add pan functionality (space + drag or middle mouse)
    let isPanning = false
    let lastPanPoint = { x: 0, y: 0 }
    let isSpacePressed = false

    // Track space key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressed = true
        canvas.defaultCursor = 'grab'
        canvas.hoverCursor = 'grab'
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressed = false
        canvas.defaultCursor = 'default'
        canvas.hoverCursor = 'move'
        if (isPanning) {
          isPanning = false
          canvas.selection = true
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    canvas.on('mouse:down', (opt) => {
      const evt = opt.e
      // Prevent middle mouse button from scrolling
      if (evt.button === 1) {
        evt.preventDefault()
        evt.stopPropagation()
      }
      
      // Pan with middle mouse, Ctrl/Cmd, or Space
      if (evt.button === 1 || evt.ctrlKey || evt.metaKey || isSpacePressed) {
        isPanning = true
        canvas.selection = false
        canvas.skipTargetFind = true
        canvas.defaultCursor = 'grabbing'
        lastPanPoint = { x: evt.clientX, y: evt.clientY }
        evt.preventDefault()
        evt.stopPropagation()
      }
    })

    canvas.on('mouse:move', (opt) => {
      if (isPanning) {
        const evt = opt.e
        const vpt = canvas.viewportTransform
        if (vpt) {
          vpt[4] += evt.clientX - lastPanPoint.x
          vpt[5] += evt.clientY - lastPanPoint.y
          canvas.requestRenderAll()
          lastPanPoint = { x: evt.clientX, y: evt.clientY }
        }
        evt.preventDefault()
        evt.stopPropagation()
      }
    })

    canvas.on('mouse:up', (opt) => {
      if (isPanning) {
        opt.e.preventDefault()
        opt.e.stopPropagation()
      }
      if (!isSpacePressed) {
        isPanning = false
        canvas.selection = true
        canvas.skipTargetFind = false
        canvas.defaultCursor = 'default'
      }
    })

    // Add zoom with mouse wheel
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY
      let zoom = canvas.getZoom()
      zoom *= 0.999 ** delta
      zoom = Math.max(0.1, Math.min(5, zoom))
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom)
      opt.e.preventDefault()
      opt.e.stopPropagation()
    })

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvas.dispose()
    }

  }, [baseTextureUrl])

  // Apply template clip to image layers with strengthened edge opacity
  const applyTemplateClip = (obj: fabric.Object) => {
    const template = templateOverlayRef.current
    const canvas = fabricCanvasRef.current
    if (!template || !canvas) return

    // Create a temporary canvas to process the mask
    const maskCanvas = document.createElement('canvas')
    const maskCtx = maskCanvas.getContext('2d')
    if (!maskCtx) return

    const canvasWidth = canvas.getWidth()
    const canvasHeight = canvas.getHeight()
    maskCanvas.width = canvasWidth
    maskCanvas.height = canvasHeight

    // Draw template at its position
    const templateElement = template.getElement() as HTMLImageElement
    if (!templateElement) return

    const tw = template.width || 1
    const th = template.height || 1
    const sx = template.scaleX || 1
    const sy = template.scaleY || 1
    const tx = template.left || 0
    const ty = template.top || 0

    maskCtx.drawImage(templateElement, tx, ty, tw * sx, th * sy)

    // Get image data and apply gamma curve to strengthen edge opacity
    const imageData = maskCtx.getImageData(0, 0, canvasWidth, canvasHeight)
    const data = imageData.data

    // Strengthen edge opacity without expanding into fully transparent space
    // gamma < 1 makes edge more opaque. Try 0.55 to 0.75.
    const gamma = 0.6

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]

      // Keep RGB white
      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255

      if (a === 0) {
        data[i + 3] = 0
      } else {
        const x = a / 255
        const y = Math.pow(x, gamma)
        data[i + 3] = Math.round(255 * y)
      }
    }

    maskCtx.putImageData(imageData, 0, 0)

    // Create fabric image from processed mask
    fabric.Image.fromURL(maskCanvas.toDataURL(), (maskImg: fabric.Image) => {
      if (!maskImg) return

      maskImg.set({
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        originX: "left",
        originY: "top",
        selectable: false,
        evented: false,
        absolutePositioned: true,
      })

      obj.clipPath = maskImg
      canvas.requestRenderAll()
    })
  }

  // Apply threshold-based mask to base color (shrinks base inward to avoid edge bleed)
  const applyShrunkBaseClip = (baseObj: fabric.Object) => {
    const template = templateOverlayRef.current
    const canvas = fabricCanvasRef.current
    if (!template || !canvas) return

    // Create a temporary canvas to process the mask with threshold
    const maskCanvas = document.createElement('canvas')
    const maskCtx = maskCanvas.getContext('2d')
    if (!maskCtx) return

    const canvasWidth = canvas.getWidth()
    const canvasHeight = canvas.getHeight()
    maskCanvas.width = canvasWidth
    maskCanvas.height = canvasHeight

    // Draw template at its position
    const templateElement = template.getElement() as HTMLImageElement
    if (!templateElement) return

    const tw = template.width || 1
    const th = template.height || 1
    const sx = template.scaleX || 1
    const sy = template.scaleY || 1
    const tx = template.left || 0
    const ty = template.top || 0

    maskCtx.drawImage(templateElement, tx, ty, tw * sx, th * sy)

    // Get image data and apply threshold to shrink base inward
    const imageData = maskCtx.getImageData(0, 0, canvasWidth, canvasHeight)
    const data = imageData.data

    // Threshold: shrinks base inward (TH = 250)
    const TH = 250

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]

      // Keep RGB white
      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255

      // Apply threshold: only keep pixels above threshold
      if (a >= TH) {
        data[i + 3] = 255
      } else {
        data[i + 3] = 0
      }
    }

    maskCtx.putImageData(imageData, 0, 0)

    // Create fabric image from processed mask
    fabric.Image.fromURL(maskCanvas.toDataURL(), (maskImg: fabric.Image) => {
      if (!maskImg) return

      maskImg.set({
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        originX: "left",
        originY: "top",
        selectable: false,
        evented: false,
        absolutePositioned: true,
      })

      baseObj.clipPath = maskImg
      canvas.requestRenderAll()
    })
  }

  // Handle base color layer - replace non-transparent template pixels with base color
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    const template = templateOverlayRef.current
    if (!canvas || !template || !baseTextureUrl) return

    // If no base color, remove base color image if present
    if (!baseColor) {
      if (baseColorObjectRef.current) {
        canvas.remove(baseColorObjectRef.current)
        baseColorObjectRef.current = null
      }
      canvas.requestRenderAll()
      return
    }

    // Create processed template with base color replacing non-transparent pixels
    const templateElement = template.getElement() as HTMLImageElement
    if (!templateElement) return

    // Create a canvas to process the template
    const processCanvas = document.createElement('canvas')
    const processCtx = processCanvas.getContext('2d')
    if (!processCtx) return

    const canvasWidth = canvas.getWidth()
    const canvasHeight = canvas.getHeight()
    processCanvas.width = canvasWidth
    processCanvas.height = canvasHeight

    // Draw template at its position with smoothing enabled
    const tw = template.width || 1
    const th = template.height || 1
    const sx = template.scaleX || 1
    const sy = template.scaleY || 1
    const tx = template.left || 0
    const ty = template.top || 0

    // Enable smoothing for smooth edges
    processCtx.imageSmoothingEnabled = true
    if ('imageSmoothingQuality' in processCtx) {
      (processCtx as any).imageSmoothingQuality = 'high'
    }

    processCtx.drawImage(templateElement, tx, ty, tw * sx, th * sy)

    // Get image data and replace non-transparent pixels with base color
    const imageData = processCtx.getImageData(0, 0, canvasWidth, canvasHeight)
    const data = imageData.data

    // Convert hex color to RGB (handle both 3 and 6 digit hex)
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

    processCtx.putImageData(imageData, 0, 0)

    // Create fabric image from processed template
    fabric.Image.fromURL(processCanvas.toDataURL(), (baseColorImg: fabric.Image) => {
      if (!baseColorImg) return

      // Remove old base color if exists
      if (baseColorObjectRef.current) {
        canvas.remove(baseColorObjectRef.current)
      }

      baseColorImg.set({
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        selectable: false,
        evented: false,
        objectCaching: false,
        originX: 'left',
        originY: 'top',
      })

      canvas.add(baseColorImg)
      baseColorImg.sendToBack()
      baseColorObjectRef.current = baseColorImg as any
      
      // Apply shrunk base clip to ensure proper masking
      applyShrunkBaseClip(baseColorImg)
      
      canvas.requestRenderAll()
    })
  }, [baseColor, baseTextureUrl])

  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const nextIds = new Set(layers.map(l => l.id))

    // Remove deleted layers
    for (const [id, obj] of layerObjectsRef.current.entries()) {
      if (!nextIds.has(id)) {
        canvas.remove(obj)
        layerObjectsRef.current.delete(id)
      }
    }

    // Add or update
    layers.forEach((layer) => {
      const existing = layerObjectsRef.current.get(layer.id)
      if (existing) {
        existing.set({
          left: layer.x,
          top: layer.y,
          scaleX: layer.scaleX,
          scaleY: layer.scaleY,
          angle: layer.rotation,
          opacity: layer.opacity,
          dirty: true,
          objectCaching: false,
        })
        if (maskEnabled) applyTemplateClip(existing)
        return
      }

      fabric.Image.fromURL(layer.imageUrl, (img) => {
        if (!img) return
        img.set({
          left: layer.x,
          top: layer.y,
          scaleX: layer.scaleX,
          scaleY: layer.scaleY,
          angle: layer.rotation,
          opacity: layer.opacity,
          dirty: true,
          objectCaching: false,
        })
        ;(img as any).layerId = layer.id

        img.on('modified', () => {
          // Hide guide line when done moving
          const canvas = fabricCanvasRef.current
          if (centerGuideLineRef.current && canvas) {
            canvas.remove(centerGuideLineRef.current)
            centerGuideLineRef.current = null
            canvas.requestRenderAll()
          }
          
          onLayerUpdate(layer.id, {
            x: img.left || 0,
            y: img.top || 0,
            scaleX: img.scaleX || 1,
            scaleY: img.scaleY || 1,
            rotation: img.angle || 0,
          })
          if (maskEnabled) applyTemplateClip(img)
        })

        img.on('moving', () => {
          // Snap to center X if close enough
          const canvas = fabricCanvasRef.current
          if (!canvas) return
          
          const canvasWidth = canvas.getWidth()
          const centerX = canvasWidth / 2
          const snapThreshold = 15 // pixels - not too aggressive
          const currentX = img.left || 0
          const imgWidth = (img.width || 0) * (img.scaleX || 1)
          const imgCenterX = currentX + imgWidth / 2
          
          // Check if image center is close to canvas center
          const distanceFromCenter = Math.abs(imgCenterX - centerX)
          
          if (distanceFromCenter < snapThreshold) {
            // Snap to center
            const snappedX = centerX - imgWidth / 2
            img.set({ left: snappedX })
            
            // Show guide line
            if (!centerGuideLineRef.current) {
              const guideLine = new fabric.Line([centerX, 0, centerX, canvas.getHeight()], {
                stroke: '#ededed',
                strokeWidth: 1,
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false,
                excludeFromExport: true,
              })
              canvas.add(guideLine)
              centerGuideLineRef.current = guideLine
            }
            canvas.requestRenderAll()
          } else {
            // Hide guide line if not snapping
            if (centerGuideLineRef.current) {
              canvas.remove(centerGuideLineRef.current)
              centerGuideLineRef.current = null
              canvas.requestRenderAll()
            }
          }
          
          if (maskEnabled) applyTemplateClip(img)
        })
        img.on('scaling', () => { if (maskEnabled) applyTemplateClip(img) })
        img.on('rotating', () => { if (maskEnabled) applyTemplateClip(img) })

        layerObjectsRef.current.set(layer.id, img)
        canvas.add(img)

        // Ensure base color stays at the bottom
        baseColorObjectRef.current?.sendToBack()
        if (maskEnabled) applyTemplateClip(img)

        canvas.requestRenderAll()
      }, { crossOrigin: 'anonymous' })
    })

    canvas.requestRenderAll()
  }, [layers, onLayerUpdate, maskEnabled])

  // Handle mask - apply/remove clipPath on all layers
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !templateOverlayRef.current) return

    // Apply or remove mask on all layer objects
    layerObjectsRef.current.forEach((img, layerId) => {
      if (maskEnabled) {
        applyTemplateClip(img)
      } else {
        img.clipPath = undefined
        canvas.renderAll()
      }
    })
  }, [maskEnabled])

  // Helper function to add an image layer with auto-scaling
  const addImageLayer = useCallback(async (imageUrl: string) => {
    // Load both images to calculate dimensions
    const uploadedImg = new Image()
    const templateImg = new Image()
    
    uploadedImg.src = imageUrl
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
      imageUrl,
      x,
      y,
      scaleX: scale,
      scaleY: scale,
      rotation: 0,
      opacity: 1,
    }
    onLayerAdd(newLayer)
  }, [baseTextureUrl, onLayerAdd])

  // Handle drag and drop
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer?.files || [])
      const imageFiles = files.filter(file => file.type.startsWith('image/'))

      for (const file of imageFiles) {
        const reader = new FileReader()
        reader.onload = async (event) => {
          const url = event.target?.result as string
          await addImageLayer(url)
        }
        reader.readAsDataURL(file)
      }
    }

    container.addEventListener('dragover', handleDragOver)
    container.addEventListener('dragleave', handleDragLeave)
    container.addEventListener('drop', handleDrop)

    return () => {
      container.removeEventListener('dragover', handleDragOver)
      container.removeEventListener('dragleave', handleDragLeave)
      container.removeEventListener('drop', handleDrop)
    }
  }, [addImageLayer])

  // Handle paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            const reader = new FileReader()
            reader.onload = async (event) => {
              const url = event.target?.result as string
              await addImageLayer(url)
            }
            reader.readAsDataURL(file)
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => {
      window.removeEventListener('paste', handlePaste)
    }
  }, [addImageLayer])

  // Handle Delete key to remove selected layer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Delete/Backspace if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const canvas = fabricCanvasRef.current
        if (!canvas) return

        const activeObject = canvas.getActiveObject()
        if (activeObject && (activeObject as any).layerId) {
          e.preventDefault()
          const layerId = (activeObject as any).layerId
          onLayerDelete(layerId)
          canvas.discardActiveObject()
          canvas.renderAll()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onLayerDelete])


  return (
    <div className="flex flex-col gap-2 h-full">
      <div 
        ref={containerRef}
        className={`flex-1 border rounded overflow-hidden bg-[#1a1a1a] flex items-center justify-center relative transition-all ${
          isDragging ? 'border-[#3a3a3a] bg-[#ededed]/[0.12]' : 'border-[#2a2a2a]'
        }`}
      >
        <canvas ref={canvasRef} />
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#ededed]/[0.12] border-2 border-dashed border-[#3a3a3a] rounded pointer-events-none">
            <div className="text-[#ededed] font-medium text-sm">Drop image here</div>
          </div>
        )}
        <div className="absolute bottom-2 right-2 text-xs text-[#707070] bg-[#1a1a1a]/90 px-2 py-1 rounded backdrop-blur-sm font-light">
          Pan: Ctrl+Drag or Middle Mouse | Zoom: Mouse Wheel
        </div>
        <div className="absolute top-2 left-2 text-xs text-[#707070] bg-[#1a1a1a]/90 px-2 py-1 rounded backdrop-blur-sm font-light">
          Drag & Drop images or press Ctrl+V to paste
        </div>
      </div>
    </div>
  )
}

