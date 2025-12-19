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
          background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 55%, #101010 100%)',
          padding: 64,
          color: '#ededed',
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
            border: '1px solid rgba(237, 237, 237, 0.14)',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: 64,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -2 }}>EvWrapStudio</div>
            <div style={{ fontSize: 32, color: 'rgba(237, 237, 237, 0.82)', lineHeight: 1.25 }}>
              Custom EV wrap designer
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'rgba(237, 237, 237, 0.65)' }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: '#ededed',
                opacity: 0.9,
              }}
            />
            <div style={{ fontSize: 24 }}>Design, preview, and share wraps</div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}

