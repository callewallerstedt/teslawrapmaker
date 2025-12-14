import fs from 'fs/promises'
import path from 'path'

export type LicensePlateAsset = {
  fileName: string
  slug: string
  displayName: string
  publicPath: string
}

const LICENSE_PLATES_DIR = path.join(process.cwd(), 'public', 'LicensePlates')

const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'])

function toDisplayName(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, '')
  return base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function slugify(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, '')
  return base
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function listLicensePlates(): Promise<LicensePlateAsset[]> {
  try {
    const entries = await fs.readdir(LICENSE_PLATES_DIR, { withFileTypes: true })
    const fileNames = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => allowedExtensions.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))

    const usedSlugs = new Map<string, number>()
    return fileNames.map((fileName) => {
      const baseSlug = slugify(fileName) || 'plate'
      const count = usedSlugs.get(baseSlug) ?? 0
      usedSlugs.set(baseSlug, count + 1)
      const slug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`

      return {
        fileName,
        slug,
        displayName: toDisplayName(fileName),
        publicPath: `/LicensePlates/${encodeURIComponent(fileName)}`,
      }
    })
  } catch {
    return []
  }
}
