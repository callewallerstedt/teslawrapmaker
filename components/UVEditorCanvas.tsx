'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
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

export interface UVEditorCanvasHandle {
  exportImage: () => string | null
  addImageLayer: (imageUrl: string) => Promise<void>
}

function UVEditorCanvasInner({
  baseTextureUrl,
  layers,
  onLayerUpdate,
  onLayerAdd,
  onLayerDelete,
  baseColor,
  maskEnabled,
}: UVEditorCanvasProps, ref: React.Ref<UVEditorCanvasHandle>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const templateOverlayRef = useRef<fabric.Image | null>(null)
  const layerObjectsRef = useRef<Map<string, fabric.Image>>(new Map())
  const baseColorObjectRef = useRef<fabric.Image | null>(null) // Base color image (processed template)
  const [isDragging, setIsDragging] = useState(false)
  const centerGuideLineRef = useRef<fabric.Line | null>(null) // Center guide line
  const [canvasSize, setCanvasSize] = useState({ width: 960, height: 640 })
  const exportImage = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return null

    // Use the displayed template that the user is aligning against
    const bg = canvas.backgroundImage as fabric.Image | undefined
    if (!bg) return null

    canvas.discardActiveObject()
    canvas.getObjects().forEach((o) => o.setCoords())

    // Fabric 5 export uses `viewportTransform` (pan/zoom) by default.
    // For texture export we must ignore the viewport so output always matches the template coordinates.
    const prevVpt = (canvas.viewportTransform || [1, 0, 0, 1, 0, 0]).slice()
    const prevBgColor = canvas.backgroundColor
    const prevBgVpt = (canvas as any).backgroundVpt

    // Template rect in canvas coordinates (world coords)
    const iw = bg.width || 1
    const ih = bg.height || 1
    const sx = bg.scaleX || 1
    const sy = bg.scaleY || 1
    const cx = bg.left || 0
    const cy = bg.top || 0

    const cropW = iw * sx
    const cropH = ih * sy
    const cropL = cx - cropW / 2
    const cropT = cy - cropH / 2

    // Multiplier that makes the cropped output exactly iw x ih pixels.
    // Background is uniformly scaled (scaleX === scaleY), so a single multiplier is correct.
    const multiplier = 1 / sx

    // Temporarily hide helper objects (e.g. snap guide line) during export
    const hidden: { obj: fabric.Object; visible: boolean | undefined }[] = []
    canvas.getObjects().forEach((obj) => {
      if ((obj as any).excludeFromExport) {
        hidden.push({ obj, visible: obj.visible })
        obj.visible = false
      }
    })

    try {
      // Ignore viewport pan/zoom so export is always in template space
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
      ;(canvas as any).backgroundVpt = true

      // Export with transparent background (no editor dark gray)
      canvas.backgroundColor = 'transparent'
      canvas.renderAll()

      return canvas.toDataURL({
        format: 'png',
        left: cropL,
        top: cropT,
        width: cropW,
        height: cropH,
        multiplier,
        enableRetinaScaling: false, // avoid devicePixelRatio scaling
      } as any)
    } finally {
      // Restore visibility and canvas state
      hidden.forEach(({ obj, visible }) => {
        obj.visible = visible
      })
      canvas.backgroundColor = prevBgColor
      ;(canvas as any).backgroundVpt = prevBgVpt
      canvas.setViewportTransform(prevVpt as any)
      canvas.renderAll()
    }
  }, [])

  // Calculate canvas size based on container
  useEffect(() => {
    if (!containerRef.current) return

    const updateCanvasSize = () => {
      if (!containerRef.current) return

      const container = containerRef.current
      // Get available space, accounting for some padding
      const containerWidth = container.clientWidth - 16
      const containerHeight = container.clientHeight - 16

      // Maintain 960:640 aspect ratio (3:2)
      const aspectRatio = 960 / 640
      let width = containerWidth
      let height = containerWidth / aspectRatio

      if (height > containerHeight) {
        height = containerHeight
        width = containerHeight * aspectRatio
      }

      // Set minimum sizes for mobile usability - ensure canvas stays usable on small screens
      const minWidth = 320 // Minimum width for mobile
      const minHeight = 213 // Minimum height maintaining aspect ratio

      width = Math.max(width, minWidth)
      height = Math.max(height, minHeight)

      // On very small screens, allow some overflow but maintain aspect ratio and usability
      if (containerWidth < minWidth || containerHeight < minHeight) {
        // For very small containers, use a smaller but still usable size
        width = Math.max(containerWidth - 16, 280)
        height = width / aspectRatio

        // Ensure height doesn't exceed container height too much (allow some overflow on mobile)
        if (height > containerHeight + 50) {
          height = containerHeight + 50
          width = height * aspectRatio
        }
      }

      setCanvasSize({ width: Math.floor(width), height: Math.floor(height) })
    }

    updateCanvasSize()

    const resizeObserver = new ResizeObserver(updateCanvasSize)
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
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
          originX: 'center',
          originY: 'center',
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
        })
        img.setCoords()
        try {
          canvas.setBackgroundImage(img, () => {
            // Reset viewport to identity (no pan/zoom)
            canvas.setViewportTransform([1, 0, 0, 1, 0, 0]) // no pan
            canvas.setZoom(1) // no zoom
            canvas.requestRenderAll()
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
        const cw = canvas.getWidth()
        const ch = canvas.getHeight()
        const imgWidth = overlayImg.width || 1
        const imgHeight = overlayImg.height || 1
        const scale = Math.min(cw / imgWidth, ch / imgHeight)

        overlayImg.set({
          originX: 'center',
          originY: 'center',
          left: cw / 2,
          top: ch / 2,
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
        })
        overlayImg.setCoords()
        templateOverlayRef.current = overlayImg
      }
    }, {
      crossOrigin: 'anonymous'
    })


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

      const p = canvas.getPointer(opt.e) // correct coordinate space
      canvas.zoomToPoint(new fabric.Point(p.x, p.y), zoom)

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

  // Resize canvas when size changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    canvas.setDimensions({
      width: canvasSize.width,
      height: canvasSize.height,
    })

    // Reset viewport to identity after resize
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]) // no pan
    canvas.setZoom(1) // no zoom

    // Re-center and re-scale background if it exists
    const bg = canvas.backgroundImage as any
    if (bg) {
      const cw = canvas.getWidth()
      const ch = canvas.getHeight()
      const bw = bg.width || 1
      const bh = bg.height || 1
      const s = Math.min(cw / bw, ch / bh)

      bg.set({
        originX: 'center',
        originY: 'center',
        left: cw / 2,
        top: ch / 2,
        scaleX: s,
        scaleY: s,
      })
      bg.setCoords?.()
    }

    // Re-center and re-scale template overlay if it exists
    const overlay = templateOverlayRef.current
    if (overlay) {
      const cw = canvas.getWidth()
      const ch = canvas.getHeight()
      const ow = overlay.width || 1
      const oh = overlay.height || 1
      const scale = Math.min(cw / ow, ch / oh)

      overlay.set({
        originX: 'center',
        originY: 'center',
        left: cw / 2,
        top: ch / 2,
        scaleX: scale,
        scaleY: scale,
      })
      overlay.setCoords()
    }

    // Reapply masks after resize to match new overlay transform
    if (maskEnabled) {
      layerObjectsRef.current.forEach((img) => applyTemplateClip(img))
      if (baseColorObjectRef.current) applyTemplateClip(baseColorObjectRef.current)
    }

    canvas.requestRenderAll()
  }, [canvasSize.width, canvasSize.height])

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

    // Generate at higher resolution for smoother zoom
    const dpr = window.devicePixelRatio || 1
    maskCanvas.width = canvasWidth * dpr
    maskCanvas.height = canvasHeight * dpr
    maskCtx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Draw template at its actual position on canvas
    const templateElement = template.getElement() as HTMLImageElement
    if (!templateElement) return

    const tw = template.width || 1
    const th = template.height || 1
    const sx = template.scaleX || 1
    const sy = template.scaleY || 1
    const cx = template.left || 0  // center X
    const cy = template.top || 0   // center Y

    const drawW = tw * sx
    const drawH = th * sy
    const drawX = cx - drawW / 2  // top-left X
    const drawY = cy - drawH / 2  // top-left Y

    maskCtx.clearRect(0, 0, canvasWidth, canvasHeight)

    // Enable smoothing for smooth mask edges
    maskCtx.imageSmoothingEnabled = true
    ;(maskCtx as any).imageSmoothingQuality = 'high'

    maskCtx.drawImage(templateElement, drawX, drawY, drawW, drawH)

    // Get image data and build smooth mask from alpha channel
    const w = Math.round(canvasWidth * dpr)
    const h = Math.round(canvasHeight * dpr)

    const imageData = maskCtx.getImageData(0, 0, w, h)
    const data = imageData.data

    // Keep original alpha for smooth edges (no hard thresholding)
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3] // template alpha
      data[i] = 255         // R
      data[i + 1] = 255     // G
      data[i + 2] = 255     // B
      data[i + 3] = a       // keep original alpha for smooth edges
    }

    maskCtx.putImageData(imageData, 0, 0)

    // Debug: check mask coverage
    let nonZero = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) nonZero++
    console.log('mask nonzero ratio', nonZero / (w * h))

    // Create fabric image from processed mask (scale back down for correct size)
    fabric.Image.fromURL(maskCanvas.toDataURL(), (maskImg: fabric.Image) => {
      if (!maskImg) return

      maskImg.set({
        left: 0,
        top: 0,
        scaleX: 1 / dpr,  // scale back down to canvas size
        scaleY: 1 / dpr,
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

    // Draw template at its actual position on canvas
    const templateElement = template.getElement() as HTMLImageElement
    if (!templateElement) return

    const tw = template.width || 1
    const th = template.height || 1
    const sx = template.scaleX || 1
    const sy = template.scaleY || 1
    const cx = template.left || 0  // center X
    const cy = template.top || 0   // center Y

    const drawW = tw * sx
    const drawH = th * sy
    const drawX = cx - drawW / 2  // top-left X
    const drawY = cy - drawH / 2  // top-left Y

    maskCtx.clearRect(0, 0, canvasWidth, canvasHeight)
    maskCtx.drawImage(templateElement, drawX, drawY, drawW, drawH)

    // Get image data and apply morphological erosion to shrink base inward
    const imageData = maskCtx.getImageData(0, 0, canvasWidth, canvasHeight)
    const data = imageData.data

    const cw = canvasWidth
    const ch = canvasHeight

    // Extract alpha into a 1-channel buffer
    let alpha = new Uint8ClampedArray(cw * ch)
    for (let p = 0; p < cw * ch; p++) {
      alpha[p] = data[p * 4 + 3]
    }

    // Shrink by N pixels (try 1 or 2)
    const shrink = 2
    for (let iter = 0; iter < shrink; iter++) {
      const out = new Uint8ClampedArray(alpha.length)
      for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
          let m = 255
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = Math.min(cw - 1, Math.max(0, x + dx))
              const ny = Math.min(ch - 1, Math.max(0, y + dy))
              m = Math.min(m, alpha[ny * cw + nx])
            }
          }
          out[y * cw + x] = m
        }
      }
      alpha = out
    }

    // Write back as white with that alpha (keeps smooth edges)
    for (let p = 0; p < cw * ch; p++) {
      const i = p * 4
      data[i] = 255       // R
      data[i + 1] = 255   // G
      data[i + 2] = 255   // B
      data[i + 3] = alpha[p] // A
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

    // Generate at higher resolution for smoother zoom
    const dpr = window.devicePixelRatio || 1
    processCanvas.width = canvasWidth * dpr
    processCanvas.height = canvasHeight * dpr
    processCtx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Draw template at its position with smoothing enabled
    const tw = template.width || 1
    const th = template.height || 1
    const sx = template.scaleX || 1
    const sy = template.scaleY || 1
    const cx = template.left || 0  // center X
    const cy = template.top || 0   // center Y

    const drawW = tw * sx
    const drawH = th * sy
    const drawX = cx - drawW / 2  // top-left X
    const drawY = cy - drawH / 2  // top-left Y

    // Enable smoothing for smooth edges
    processCtx.imageSmoothingEnabled = true
    if ('imageSmoothingQuality' in processCtx) {
      (processCtx as any).imageSmoothingQuality = 'high'
    }

    processCtx.drawImage(templateElement, drawX, drawY, drawW, drawH)

    // Get image data and replace non-transparent pixels with base color
    const w = Math.round(canvasWidth * dpr)
    const h = Math.round(canvasHeight * dpr)

    const imageData = processCtx.getImageData(0, 0, w, h)
    const data = imageData.data

    // Convert hex color to RGB (handle both 3 and 6 digit hex)
    let hex = baseColor.replace('#', '')
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('')
    }
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    // Replace non-transparent pixels with base color, preserve anti-aliasing
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]
      if (a === 0) continue // keep fully transparent as transparent

      data[i] = r       // R
      data[i + 1] = g   // G
      data[i + 2] = b   // B
      data[i + 3] = a   // preserve antialiasing, covers all non-transparent pixels
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
        scaleX: 1 / dpr,  // scale back down to canvas size
        scaleY: 1 / dpr,
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
          originX: 'center',
          originY: 'center',
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
          originX: 'center',
          originY: 'center',
          dirty: true,
          objectCaching: false,
        })
        ;(img as any).layerId = layer.id

        img.on('rotating', () => {
          // Snap rotation to nearest 10 degrees during rotation for real-time feedback
          const currentAngle = img.angle || 0
          const snappedAngle = Math.round(currentAngle / 10) * 10
          img.set('angle', snappedAngle)
        })

        img.on('modified', () => {
          // Hide guide line when done moving
          const canvas = fabricCanvasRef.current
          if (centerGuideLineRef.current && canvas) {
            canvas.remove(centerGuideLineRef.current)
            centerGuideLineRef.current = null
            canvas.requestRenderAll()
          }

          // Ensure final rotation is snapped to nearest 10 degrees
          const currentAngle = img.angle || 0
          const snappedAngle = Math.round(currentAngle / 10) * 10
          img.set('angle', snappedAngle)

          onLayerUpdate(layer.id, {
            x: img.left || 0, // With originX: 'center', this is the center X
            y: img.top || 0,  // With originY: 'center', this is the center Y
            scaleX: img.scaleX || 1,
            scaleY: img.scaleY || 1,
            rotation: snappedAngle,
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

          // Since we use originX: 'center', currentX is already the center of the object
          const imgCenterX = currentX

          // Check if image center is close to canvas center
          const distanceFromCenter = Math.abs(imgCenterX - centerX)

          if (distanceFromCenter < snapThreshold) {
            // Snap to center - since originX is 'center', we set left directly to centerX
            img.set({ left: centerX })
            
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
        })

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
      }
    })

    // Apply or remove mask on base color too
    if (maskEnabled) {
      if (baseColorObjectRef.current) applyTemplateClip(baseColorObjectRef.current)
    } else {
      if (baseColorObjectRef.current) baseColorObjectRef.current.clipPath = undefined
    }

    canvas.requestRenderAll()
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
    
    // Get real canvas dimensions
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const canvasWidth = canvas.getWidth()
    const canvasHeight = canvas.getHeight()

    // Calculate scale to make uploaded image 50% of template size
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

    // Position at canvas center (objects use originX: 'center', originY: 'center')
    const x = canvasWidth / 2
    const y = canvasHeight / 2
    
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

  useImperativeHandle(
    ref,
    () => ({
      exportImage,
      addImageLayer,
    }),
    [exportImage, addImageLayer]
  )

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
    <div className="flex flex-col gap-2 h-full min-h-[400px] sm:min-h-[500px]">
      <div
        ref={containerRef}
        className={`flex-1 border rounded overflow-auto bg-[#1a1a1a] flex items-center justify-center relative transition-all min-h-[300px] sm:min-h-[400px] ${
          isDragging ? 'border-[#3a3a3a] bg-[#ededed]/[0.12]' : 'border-[#2a2a2a]'
        }`}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            maxWidth: '100%',
            maxHeight: '100%',
            imageRendering: 'auto'
          }}
        />
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#ededed]/[0.12] border-2 border-dashed border-[#3a3a3a] rounded pointer-events-none">
            <div className="text-[#ededed] font-medium text-sm">Drop image here</div>
          </div>
        )}
        <div className="hidden sm:block absolute bottom-2 right-2 text-xs text-[#707070] bg-[#1a1a1a]/90 px-2 py-1 rounded backdrop-blur-sm font-light">
          Pan: Ctrl+Drag or Middle Mouse | Zoom: Mouse Wheel
        </div>
        <div className="hidden sm:block absolute top-2 left-2 text-xs text-[#707070] bg-[#1a1a1a]/90 px-2 py-1 rounded backdrop-blur-sm font-light">
          Drag & Drop images or press Ctrl+V to paste
        </div>
      </div>
    </div>
  )
}

const UVEditorCanvas = forwardRef<UVEditorCanvasHandle, UVEditorCanvasProps>(UVEditorCanvasInner)

export default UVEditorCanvas
