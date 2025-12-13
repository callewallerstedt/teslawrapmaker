export default function Loading() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center" style={{ backgroundColor: '#1a1a1a !important' }}>
      <div className="text-center">
        <div
          className="animate-spin rounded-full h-12 w-12 mx-auto mb-4"
          style={{
            border: '2px solid transparent',
            borderTop: '2px solid #ededed',
            borderRight: '2px solid transparent',
            borderBottom: '2px solid transparent',
            borderLeft: '2px solid transparent'
          }}
        ></div>
        <p className="text-[#a0a0a0] font-light" style={{ color: '#a0a0a0 !important' }}>Loading...</p>
      </div>
    </div>
  )
}
