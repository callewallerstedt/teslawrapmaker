// Supabase database utilities
import { supabase, supabaseAdmin } from './supabase'
import { CarModel, Wrap } from './types'
import { readdir } from 'fs/promises'
import { join } from 'path'

let carModelsCache: CarModel[] | null = null

// Format model folder name to display name
function formatModelName(folderName: string): string {
  // Handle cybertruck
  if (folderName === 'cybertruck') {
    return 'Tesla Cybertruck'
  }
  
  // Handle model3 variants
  if (folderName.startsWith('model3')) {
    const parts = folderName.split('-')
    if (parts.length === 1) {
      return 'Tesla Model 3'
    } else if (parts.length === 3) {
      const year = parts[1]
      const variant = parts[2]
      return `Tesla Model 3 ${year} ${variant.charAt(0).toUpperCase() + variant.slice(1)}`
    }
  }
  
  // Handle modely variants
  if (folderName.startsWith('modely')) {
    const parts = folderName.split('-')
    if (parts.length === 1) {
      return 'Tesla Model Y'
    } else if (parts.length === 2) {
      if (parts[1] === 'l') {
        return 'Tesla Model Y Long Range'
      }
    } else if (parts.length === 3) {
      const year = parts[1]
      const variant = parts[2]
      return `Tesla Model Y ${year} ${variant.charAt(0).toUpperCase() + variant.slice(1)}`
    }
  }
  
  // Fallback: capitalize and format
  return folderName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Dynamically discover car models from public directory
async function discoverCarModels(): Promise<CarModel[]> {
  if (carModelsCache) {
    return carModelsCache
  }

  const models: CarModel[] = []
  const publicPath = join(process.cwd(), 'public')
  
  try {
    const entries = await readdir(publicPath, { withFileTypes: true })
    
    for (const entry of entries) {
      // Skip if not a directory or if it's the models/uvmaps folders
      if (!entry.isDirectory() || entry.name === 'models' || entry.name === 'uvmaps') {
        continue
      }
      
      const modelFolder = entry.name
      const modelPath = join(publicPath, modelFolder)
      
      // Check if vehicle_image.png and template.png exist
      try {
        const files = await readdir(modelPath)
        const hasVehicleImage = files.includes('vehicle_image.png')
        const hasTemplate = files.includes('template.png')
        
        if (hasVehicleImage && hasTemplate) {
          models.push({
            id: modelFolder,
            name: formatModelName(modelFolder),
            previewImage: `/${modelFolder}/vehicle_image.png`,
            uvTextureUrl: `/${modelFolder}/template.png`,
            meshModelUrl: `/${modelFolder}/template.png`,
          })
        }
      } catch (err) {
        // Skip if we can't read the directory
        console.warn(`Could not read model folder: ${modelFolder}`, err)
      }
    }
    
    carModelsCache = models
    return models
  } catch (error) {
    console.error('Error discovering car models:', error)
    return []
  }
}

export async function getCarModels(): Promise<CarModel[]> {
  const models = await discoverCarModels()
  // Move cybertruck to the end
  const cybertruckIndex = models.findIndex(m => m.id === 'cybertruck')
  if (cybertruckIndex !== -1) {
    const cybertruck = models.splice(cybertruckIndex, 1)[0]
    models.push(cybertruck)
  }
  return models
}

export async function getCarModel(id: string): Promise<CarModel | null> {
  const models = await getCarModels()
  return models.find((m) => m.id === id) || null
}

// Get all wraps from Supabase
export async function getWraps(): Promise<Wrap[]> {
  const { data, error } = await supabase
    .from('wraps')
    .select('*')
    .order('likes', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching wraps:', error)
    return []
  }

  // Transform Supabase data to Wrap format
  return (data || []).map((row) => ({
    id: row.id,
    authorId: row.author_id,
    carModelId: row.car_model_id,
    textureUrl: row.texture_url,
    previewRenderUrl: row.preview_render_url,
    title: row.title,
    username: row.username || 'user',
    likes: row.likes || 0,
    createdAt: row.created_at,
  }))
}

// Get a single wrap by ID
export async function getWrap(id: string): Promise<Wrap | null> {
  const { data, error } = await supabase
    .from('wraps')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching wrap:', error)
    return null
  }

  if (!data) return null

  return {
    id: data.id,
    authorId: data.author_id,
    carModelId: data.car_model_id,
    textureUrl: data.texture_url,
    previewRenderUrl: data.preview_render_url,
    title: data.title,
    username: data.username || 'user',
    likes: data.likes || 0,
    createdAt: data.created_at,
  }
}

// Create a new wrap in Supabase
export async function createWrap(wrap: Omit<Wrap, 'id' | 'createdAt' | 'likes'>): Promise<Wrap> {
  const { data, error } = await supabase
    .from('wraps')
    .insert({
      car_model_id: wrap.carModelId,
      texture_url: wrap.textureUrl,
      preview_render_url: wrap.previewRenderUrl,
      title: wrap.title,
      username: wrap.username || 'user',
      author_id: wrap.authorId || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating wrap:', error)
    throw error
  }

  return {
    id: data.id,
    authorId: data.author_id,
    carModelId: data.car_model_id,
    textureUrl: data.texture_url,
    previewRenderUrl: data.preview_render_url,
    title: data.title,
    likes: data.likes || 0,
    createdAt: data.created_at,
  }
}

// Like a wrap (increment likes count)
export async function likeWrap(id: string): Promise<Wrap | null> {
  // First get current likes
  const { data: currentWrap } = await supabase
    .from('wraps')
    .select('likes')
    .eq('id', id)
    .single()

  if (!currentWrap) return null

  // Increment likes
  const { data, error } = await supabase
    .from('wraps')
    .update({ likes: (currentWrap.likes || 0) + 1 })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error liking wrap:', error)
    return null
  }

  return {
    id: data.id,
    authorId: data.author_id,
    carModelId: data.car_model_id,
    textureUrl: data.texture_url,
    previewRenderUrl: data.preview_render_url,
    title: data.title,
    likes: data.likes || 0,
    createdAt: data.created_at,
  }
}





