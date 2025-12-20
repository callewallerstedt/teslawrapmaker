import type { Metadata } from 'next'
import './globals.css'

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://www.evwrapstudio.com/'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'EvWrapStudio - Explore and design custom Tesla wraps.',
    template: '%s | EvWrapStudio',
  },
  description:
    'Explore, design, and share custom Tesla wraps and paint jobs. Upload templates, build your own designs, and publish textures for others to download.',
  openGraph: {
    title: 'EvWrapStudio - Explore and design custom Tesla wraps.',
    description:
      'Explore, design, and share custom Tesla wraps and paint jobs. Upload templates, build your own designs, and publish textures for others to download.',
    type: 'website',
    url: '/',
    siteName: 'EvWrapStudio',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'EvWrapStudio - Explore and design custom Tesla wraps.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EvWrapStudio - Explore and design custom Tesla wraps.',
    description:
      'Explore, design, and share custom Tesla wraps and paint jobs. Upload templates, build your own designs, and publish textures for others to download.',
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
