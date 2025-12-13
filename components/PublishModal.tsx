'use client'

import { useState } from 'react'

interface PublishModalProps {
  isOpen: boolean
  onClose: () => void
  onPublish: (title: string, description: string, username: string) => Promise<void>
}

export default function PublishModal({ isOpen, onClose, onPublish }: PublishModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [username, setUsername] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsPublishing(true)
    try {
      await onPublish(title.trim(), description.trim(), username.trim())
      setTitle('')
      setDescription('')
      setUsername('')
      onClose()
    } catch (error) {
      console.error('Failed to publish:', error)
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] rounded border border-[#2a2a2a] p-6 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-[#ededed] tracking-tight">Publish Your Wrap</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#ededed] mb-2 tracking-tight">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Wrap"
              className="w-full px-3 py-2 border border-[#2a2a2a] rounded bg-[#ededed]/[0.12] text-[#ededed] focus:outline-none focus:ring-1 focus:ring-[#ededed] focus:border-[#3a3a3a] placeholder:text-[#707070]"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#ededed] mb-2 tracking-tight">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 border border-[#2a2a2a] rounded bg-[#ededed]/[0.12] text-[#ededed] focus:outline-none focus:ring-1 focus:ring-[#ededed] focus:border-[#3a3a3a] placeholder:text-[#707070]"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#ededed] mb-2 tracking-tight">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your wrap design..."
              rows={3}
              className="w-full px-3 py-2 border border-[#2a2a2a] rounded bg-[#ededed]/[0.12] text-[#ededed] focus:outline-none focus:ring-1 focus:ring-[#ededed] focus:border-[#3a3a3a] placeholder:text-[#707070] resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#ededed] border border-[#2a2a2a] rounded bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPublishing || !title.trim()}
              className="px-4 py-2 text-[#ededed] border border-[#2a2a2a] rounded bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {isPublishing ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
