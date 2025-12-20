import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #ffffff 0%, #fff3f3 55%, #ffffff 100%)',
          padding: 64,
          color: '#0a0a0a',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRadius: 36,
            border: '2px solid rgba(208, 0, 0, 0.18)',
            background: 'rgba(255, 255, 255, 0.75)',
            padding: 64,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: '#d00000',
                }}
              />
              <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -2 }}>EvWrapStudio</div>
            </div>
            <div style={{ fontSize: 32, color: 'rgba(10, 10, 10, 0.78)', lineHeight: 1.25 }}>
              Explore and design custom Tesla wraps.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'rgba(10, 10, 10, 0.65)' }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: '#d00000',
                opacity: 0.9,
              }}
            />
            <div style={{ fontSize: 24 }}>Design, preview, share, and download textures</div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
