'use client'

interface LiquidBackgroundProps {
  opacity?: number;
}

export default function LiquidBackground({ opacity = 1 }: LiquidBackgroundProps) {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#1a1a1a]" />

        <div
          className="absolute left-[10%] top-[8%] h-[52vmax] w-[52vmax] rounded-full blur-[48px]"
          style={{
            opacity: 0.6 * opacity,
            background:
              `radial-gradient(circle at 30% 35%, rgba(239,68,68,${0.38 * opacity}), transparent 62%), radial-gradient(circle at 70% 60%, rgba(255,255,255,${0.18 * opacity}), transparent 58%)`,
          }}
        />

        <div
          className="absolute right-[10%] top-[5%] h-[42vmax] w-[42vmax] rounded-full blur-[44px]"
          style={{
            opacity: 0.45 * opacity,
            background:
              `radial-gradient(circle at 45% 40%, rgba(239,68,68,${0.30 * opacity}), transparent 62%), radial-gradient(circle at 70% 65%, rgba(255,255,255,${0.14 * opacity}), transparent 58%)`,
          }}
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              `radial-gradient(1100px 650px at 50% 30%, rgba(255,255,255,${0.05 * opacity}), transparent 60%), radial-gradient(900px 500px at 50% 78%, rgba(239,68,68,${0.06 * opacity}), transparent 65%)`,
          }}
        />
      </div>
    </>
  )
}