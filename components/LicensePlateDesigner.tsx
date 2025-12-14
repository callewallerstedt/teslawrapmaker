'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  backgroundUrl: string
  fileName: string
}

const CANVAS_WIDTH = 420
const CANVAS_HEIGHT = 100

export default function LicensePlateDesigner({ backgroundUrl, fileName }: Props) {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null)
  const fabricCanvasRef = useRef<any>(null)
  const fabricRef = useRef<any>(null)
  const [ready, setReady] = useState(false)
  const [activeText, setActiveText] = useState<any>(null)
  const [charSpacing, setCharSpacing] = useState(0)
  const defaultTextAddedRef = useRef(false)

  const defaultFontFamily = useMemo(
    () =>
      [
        '"DIN 1451 Mittelschrift"',
        '"DIN Alternate"',
        'DIN',
        '"Arial Narrow"',
        'Arial',
        'sans-serif',
      ].join(', '),
    [],
  )

  useEffect(() => {
    let disposed = false

    async function init() {
      const fabricModule: any = await import('fabric')
      if (disposed) return
      const fabric = fabricModule.fabric ?? fabricModule
      fabricRef.current = fabric

      const el = canvasElRef.current
      if (!el) return

      const canvas = new fabric.Canvas(el, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: 'transparent',
        preserveObjectStacking: true,
        selection: true,
      })
      fabricCanvasRef.current = canvas

      const snapThresholdPx = 8

      canvas.on('object:moving', (opt: any) => {
        const target = opt?.target
        if (!target) return

        const centerY = canvas.getHeight() / 2
        const targetCenterY = target.getCenterPoint().y
        if (Math.abs(targetCenterY - centerY) <= snapThresholdPx) {
          target.setPositionByOrigin(new fabric.Point(target.getCenterPoint().x, centerY), 'center', 'center')
          target.setCoords()
        }
      })

      const syncActiveText = () => {
        const obj = canvas.getActiveObject()
        if (obj && (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text')) {
          setActiveText(obj)
          setCharSpacing(typeof obj.charSpacing === 'number' ? obj.charSpacing : 0)
        } else {
          setActiveText(null)
        }
      }
      canvas.on('selection:created', syncActiveText)
      canvas.on('selection:updated', syncActiveText)
      canvas.on('selection:cleared', syncActiveText)

      fabric.Image.fromURL(
        backgroundUrl,
        (img: any) => {
          if (!img) return
          img.set({ selectable: false, evented: false })

          const scaleX = CANVAS_WIDTH / img.width
          const scaleY = CANVAS_HEIGHT / img.height
          img.set({ scaleX, scaleY })

          canvas.setBackgroundImage(img, () => {
            canvas.requestRenderAll()
            setReady(true)

            if (!defaultTextAddedRef.current) {
              const text = new fabric.IText('ABC123', {
                left: CANVAS_WIDTH / 2,
                top: CANVAS_HEIGHT / 2,
                originX: 'center',
                originY: 'center',
                fontFamily: defaultFontFamily,
                fontSize: 54,
                fontWeight: 600,
                fill: '#111111',
                selectable: true,
                charSpacing: 0,
              })
              canvas.add(text)
              canvas.setActiveObject(text)
              setActiveText(text)
              setCharSpacing(0)
              canvas.requestRenderAll()
              defaultTextAddedRef.current = true
            }
          })
        },
        { crossOrigin: 'anonymous' },
      )
    }

    init()

    return () => {
      disposed = true
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose()
        fabricCanvasRef.current = null
      }
    }
  }, [backgroundUrl])

  const addText = useCallback(() => {
    const canvas = fabricCanvasRef.current
    const fabric = fabricRef.current
    if (!canvas || !fabric) return

    const text = new fabric.IText('ABC123', {
      left: 40,
      top: CANVAS_HEIGHT / 2,
      originX: 'left',
      originY: 'center',
      fontFamily: defaultFontFamily,
      fontSize: 54,
      fontWeight: 600,
      fill: '#111111',
      selectable: true,
      charSpacing: 0,
    })

    canvas.add(text)
    canvas.setActiveObject(text)
    setActiveText(text)
    setCharSpacing(0)
    canvas.requestRenderAll()
  }, [defaultFontFamily])

  const deleteSelected = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return
    const obj = canvas.getActiveObject()
    if (!obj) return
    if (obj.selectable === false) return
    canvas.remove(obj)
    canvas.discardActiveObject()
    setActiveText(null)
    canvas.requestRenderAll()
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const canvas = fabricCanvasRef.current
      if (!canvas) return

      const obj = canvas.getActiveObject()
      if (!obj) return

      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || (target as any)?.isContentEditable) return

      e.preventDefault()
      deleteSelected()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [deleteSelected])

  const applyCharSpacing = useCallback(
    (next: number) => {
      const canvas = fabricCanvasRef.current
      if (!canvas || !activeText) return
      const clamped = Math.max(-200, Math.min(600, next))
      activeText.set({ charSpacing: clamped })
      setCharSpacing(clamped)
      canvas.requestRenderAll()
    },
    [activeText],
  )

  const downloadPng = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    canvas.discardActiveObject()
    canvas.requestRenderAll()

    const dataUrl = canvas.toDataURL({ format: 'png' })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${fileName.replace(/\.[^.]+$/, '')}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }, [fileName])

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          type="button"
          onClick={addText}
          disabled={!ready}
          className="px-4 py-2 text-sm font-medium rounded-lg border-2 border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a] transition-all disabled:opacity-50 disabled:hover:bg-[#ededed]/[0.12] disabled:hover:border-[#2a2a2a]"
        >
          Add text
        </button>
        <button
          type="button"
          onClick={deleteSelected}
          disabled={!ready || !activeText}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-[#2a2a2a] bg-[#111] text-[#ededed] hover:bg-[#151515] transition-all disabled:opacity-50"
        >
          Delete
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => applyCharSpacing(charSpacing - 10)}
            disabled={!ready || !activeText}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-[#2a2a2a] bg-[#111] text-[#ededed] hover:bg-[#151515] disabled:opacity-50"
            aria-label="Decrease character spacing"
          >
            −
          </button>
          <label className="text-xs text-[#a0a0a0] whitespace-nowrap">Spacing</label>
          <input
            type="range"
            min={-200}
            max={600}
            step={5}
            value={charSpacing}
            onChange={(e) => applyCharSpacing(Number(e.target.value))}
            disabled={!ready || !activeText}
            className="w-40 accent-[#ededed]"
          />
          <button
            type="button"
            onClick={() => applyCharSpacing(charSpacing + 10)}
            disabled={!ready || !activeText}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-[#2a2a2a] bg-[#111] text-[#ededed] hover:bg-[#151515] disabled:opacity-50"
            aria-label="Increase character spacing"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={downloadPng}
          disabled={!ready}
          className="px-4 py-2 text-sm font-medium rounded-lg border-2 border-[#ededed] bg-[#ededed] text-[#1a1a1a] hover:bg-[#ededed]/90 transition-all disabled:opacity-50"
        >
          Download PNG
        </button>
        <div className="text-xs text-[#a0a0a0]">
          Drag text to move. It snaps to vertical center (horizontal guide line). Use Delete/Backspace or the Delete button.
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div
          className="relative rounded-lg border border-[#2a2a2a] bg-[#0b0b0b] p-3 inline-block"
          style={{ width: CANVAS_WIDTH + 24 }}
        >
          <div className="absolute left-3 right-3 top-1/2 h-px bg-[#ededed]/20 pointer-events-none" />
          <canvas ref={canvasElRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block" />
        </div>
      </div>
    </div>
  )
}
