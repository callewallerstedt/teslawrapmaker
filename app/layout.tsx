import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TeslaWrapMaker - Custom Car Wrap Designer',
  description: 'Design and preview custom car wraps in real-time',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#1a1a1a] text-[#ededed] antialiased">{children}</body>
    </html>
  )
}

