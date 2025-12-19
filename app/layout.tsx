import type { Metadata } from 'next'
import './globals.css'

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'EvWrapStudio - Custom EV Wrap Designer',
    template: '%s | EvWrapStudio',
  },
  description: 'Design and explore custom electric vehicle wraps. Upload your designs, position them perfectly, and create stunning EV transformations.',
  openGraph: {
    title: 'EvWrapStudio - Custom EV Wrap Designer',
    description:
      'Design and explore custom electric vehicle wraps. Upload your designs, position them perfectly, and create stunning EV transformations.',
    type: 'website',
    url: '/',
    siteName: 'EvWrapStudio',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'EvWrapStudio - Custom EV Wrap Designer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EvWrapStudio - Custom EV Wrap Designer',
    description:
      'Design and explore custom electric vehicle wraps. Upload your designs, position them perfectly, and create stunning EV transformations.',
    images: ['/twitter-image'],
  },
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
      <body className="text-[#ededed] antialiased">
        {children}
        <div id="evwrapstudio-modal-root" />
      </body>
    </html>
  )
}
