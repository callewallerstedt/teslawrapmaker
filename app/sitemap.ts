import type { MetadataRoute } from 'next'
import { supabase, supabaseAdmin } from '@/lib/supabase'

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.evwrapstudio.com/').replace(/\/?$/, '/')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const client = supabaseAdmin || supabase

  const items: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: 'daily',
      priority: 1,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}explore`,
      changeFrequency: 'daily',
      priority: 0.9,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}design`,
      changeFrequency: 'weekly',
      priority: 0.6,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}license-plate`,
      changeFrequency: 'monthly',
      priority: 0.3,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}privacy`,
      changeFrequency: 'yearly',
      priority: 0.2,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}terms`,
      changeFrequency: 'yearly',
      priority: 0.2,
      lastModified: new Date(),
    },
  ]

  try {
    const { data, error } = await client
      .from('wraps')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(50000)

    if (error) {
      console.error('Sitemap wraps query failed:', error)
      return items
    }

    for (const row of data || []) {
      items.push({
        url: `${baseUrl}wrap/${row.id}`,
        changeFrequency: 'weekly',
        priority: 0.8,
        lastModified: row.created_at ? new Date(row.created_at) : new Date(),
      })
    }
  } catch (error) {
    console.error('Sitemap generation failed:', error)
  }

  return items
}

