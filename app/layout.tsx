import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EvWrapStudio - Custom EV Wrap Designer',
  description: 'Design and explore custom electric vehicle wraps. Upload your designs, position them perfectly, and create stunning EV transformations.',
  icons: {
    icon: '/icon.png',
  },
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

