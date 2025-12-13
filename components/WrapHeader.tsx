'use client'

interface WrapHeaderProps {
  title: string
  username?: string
  description?: string
  likes: number
  createdAt: string
}

export default function WrapHeader({ title, username, description, likes, createdAt }: WrapHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-semibold text-[#ededed] mb-2 tracking-tight">{title}</h1>
      {username && (
        <p className="text-sm text-[#a0a0a0] mb-2 font-light">by {username}</p>
      )}
      {description && (
        <div className="mb-4 max-w-2xl">
          <p className="text-base text-[#a0a0a0] font-light leading-relaxed whitespace-pre-wrap">{description}</p>
        </div>
      )}
      <div className="flex items-center gap-4 text-sm text-[#707070] font-light">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span>{likes} {likes === 1 ? 'like' : 'likes'}</span>
        </div>
        <span>•</span>
        <span>{new Date(createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  )
}






