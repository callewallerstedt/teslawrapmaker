import type { MetadataRoute } from 'next'

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.evwrapstudio.com/').replace(/\/?$/, '/')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${baseUrl}sitemap.xml`,
    host: baseUrl.replace(/\/$/, ''),
  }
}

