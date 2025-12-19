'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [mounted, setMounted] = useState(false)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setMounted(true)
    if (typeof document === 'undefined') return

    // Use a stable portal root to avoid DOM ordering issues in <body>.
    let root = document.getElementById('evwrapstudio-modal-root') as HTMLDivElement | null
    if (!root) {
      // Fallback: create once if layout hasn't rendered it for some reason.
      root = document.createElement('div')
      root.id = 'evwrapstudio-modal-root'
      document.body.appendChild(root)
    }
    setPortalTarget(root)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  if (!mounted || !isOpen || !portalTarget) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Support modal"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close modal"
        className="absolute inset-0 bg-black/60"
      />

      <div className="relative mx-auto mt-[10dvh] max-w-md w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
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
          <h3 className="text-lg font-semibold text-[#ededed] mb-3">Support EvWrapStudio</h3>
          <p className="text-sm text-[#a0a0a0] mb-4 leading-relaxed">
            EvWrapStudio is completely free and will always remain free. However, maintaining and improving the platform takes time and resources. If you'd like to support the project, every contribution no matter how small is appreciated!
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-[#a0a0a0] rounded border border-[#2a2a2a] bg-transparent hover:bg-[#ededed]/[0.05] transition-all"
          >
            No Thanks
          </button>
          <button
            onClick={() => {
              window.open('https://www.paypal.com/donate?hosted_button_id=N8EMZTSSPYP6L', '_blank')
              onClose()
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
    </div>,
    portalTarget,
  )
}
