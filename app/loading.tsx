export default function Loading() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ededed] mx-auto mb-4"></div>
        <p className="text-[#a0a0a0] font-light">Loading...</p>
      </div>
    </div>
  )
}
