// Database utilities - Supabase implementation
// To use in-memory storage instead, comment out Supabase imports and uncomment the in-memory code below

import { readdir } from 'fs/promises'
import { join } from 'path'
import { CarModel, Wrap } from './types'
import { supabase } from './supabase'

let carModelsCache: CarModel[] | null = null

// In-memory storage (fallback if Supabase not configured)
// Uncomment below and comment out Supabase code if needed
// let wraps: Wrap[] = []

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
            meshModelUrl: `/${modelFolder}/template.png`, // Using template as placeholder for now
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

export async function getWraps(): Promise<Wrap[]> {
  // Supabase implementation
  try {
    const { data, error } = await supabase
      .from('wraps')
      .select('*')
      .order('likes', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching wraps:', error)
      return []
    }

    return (data || []).map((row) => ({
      id: row.id,
      authorId: row.author_id,
      carModelId: row.car_model_id,
      textureUrl: row.texture_url,
      previewRenderUrl: row.preview_render_url,
      title: row.title,
      description: row.description,
      username: row.username,
      likes: row.likes || 0,
      createdAt: row.created_at,
    }))
  } catch (error) {
    console.error('Supabase not configured, falling back to empty array')
    return []
  }

  // In-memory fallback (uncomment if needed)
  // return wraps.sort((a, b) => b.likes - a.likes || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getWrap(id: string): Promise<Wrap | null> {
  // Supabase implementation
  try {
    const { data, error } = await supabase
      .from('wraps')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

  return {
    id: data.id,
    authorId: data.author_id,
    carModelId: data.car_model_id,
    textureUrl: data.texture_url,
    previewRenderUrl: data.preview_render_url,
    title: data.title,
    description: data.description,
    username: data.username,
    likes: data.likes || 0,
    createdAt: data.created_at,
  }
  } catch (error) {
    console.error('Supabase not configured')
    return null
  }

  // In-memory fallback
  // return wraps.find((w) => w.id === id) || null
}

export async function createWrap(wrap: Omit<Wrap, 'id' | 'createdAt' | 'likes'>): Promise<Wrap> {
  // Supabase implementation
  try {
    const { data, error } = await supabase
      .from('wraps')
      .insert({
        car_model_id: wrap.carModelId,
        texture_url: wrap.textureUrl,
        preview_render_url: wrap.previewRenderUrl,
        title: wrap.title,
        description: wrap.description || null,
        username: wrap.username || null,
        author_id: wrap.authorId || null,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

  return {
    id: data.id,
    authorId: data.author_id,
    carModelId: data.car_model_id,
    textureUrl: data.texture_url,
    previewRenderUrl: data.preview_render_url,
    title: data.title,
    description: data.description,
    username: data.username,
    likes: data.likes || 0,
    createdAt: data.created_at,
  }
  } catch (error) {
    console.error('Error creating wrap:', error)
    throw error
  }

  // In-memory fallback
  // const newWrap: Wrap = {
  //   ...wrap,
  //   id: `wrap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  //   likes: 0,
  //   createdAt: new Date().toISOString(),
  // }
  // wraps.push(newWrap)
  // return newWrap
}

// Check if user has already liked a wrap
export async function hasUserLikedWrap(wrapId: string, ipAddress: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('wrap_likes')
      .select('id')
      .eq('wrap_id', wrapId)
      .eq('ip_address', ipAddress)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking like:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Supabase not configured for like check')
    return false
  }
}

export async function likeWrap(id: string, ipAddress: string): Promise<Wrap | null> {
  // Supabase implementation
  try {
    // First, record the like in wrap_likes table
    const { error: likeError } = await supabase
      .from('wrap_likes')
      .insert({
        wrap_id: id,
        ip_address: ipAddress,
      })

    if (likeError) {
      // If it's a unique constraint violation, user already liked
      if (likeError.code === '23505') {
        console.log('User already liked this wrap')
        return null
      }
      console.error('Error recording like:', likeError)
      return null
    }

    // Get current likes
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
    description: data.description,
    username: data.username,
    likes: data.likes || 0,
    createdAt: data.created_at,
  }
  } catch (error) {
    console.error('Supabase not configured')
    return null
  }

  // In-memory fallback
  // const wrap = wraps.find((w) => w.id === id)
  // if (wrap) {
  //   wrap.likes++
  //   return wrap
  // }
  // return null
}

