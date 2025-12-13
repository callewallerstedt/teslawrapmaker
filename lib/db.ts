// Database utilities - Supabase implementation
// To use in-memory storage instead, comment out Supabase imports and uncomment the in-memory code below

import { readdir } from 'fs/promises'
import { join } from 'path'
import { CarModel, Wrap } from './types'
import { supabase, supabaseAdmin } from './supabase'

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
        return 'Tesla Model Y L'
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
    // Use admin client if available for consistent reads with likes updates
    const client = supabaseAdmin || supabase

    const { data, error } = await client
      .from('wraps')
      .select('id, author_id, car_model_id, texture_url, preview_render_url, title, description, username, likes, created_at')
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
      description: row.description || undefined,
      username: row.username || undefined,
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
    // Use admin client if available for consistent reads with likes updates
    const client = supabaseAdmin || supabase

    const { data, error } = await client
      .from('wraps')
      .select('id, author_id, car_model_id, texture_url, preview_render_url, title, description, username, likes, created_at')
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
    description: data.description || undefined,
    username: data.username || undefined,
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
    const client = supabase // Use consistent client

    const { data, error } = await client
      .from('wraps')
      .insert({
        car_model_id: wrap.carModelId,
        texture_url: wrap.textureUrl,
        preview_render_url: wrap.previewRenderUrl,
        title: wrap.title,
        description: wrap.description || null,
        username: wrap.username || 'user',
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
    description: data.description || undefined,
    username: data.username || undefined,
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
    const client = supabase // Use consistent client

    console.log('Checking if user liked wrap:', wrapId, 'IP:', ipAddress)

    const { data, error } = await client
      .from('wrap_likes')
      .select('id')
      .eq('wrap_id', wrapId) // Supabase will handle UUID conversion
      .eq('ip_address', ipAddress)
      .maybeSingle()

    console.log('Like check result - data:', data, 'error:', error)

    if (error) {
      console.error('Error checking like:', error)
      return false
    }

    const hasLiked = !!data
    console.log('User has liked wrap:', hasLiked)
    return hasLiked
  } catch (error) {
    console.error('Supabase not configured for like check')
    return false
  }
}

export async function likeWrap(id: string, ipAddress: string): Promise<
  | { status: 'liked'; wrap: Wrap }
  | { status: 'already_liked'; wrap: Wrap }
  | { status: 'not_found' }
> {
  try {
    const client = supabase // Use consistent client

    console.log('Liking wrap:', id, 'for IP:', ipAddress)

    // First, record the like in wrap_likes table
    const { error: likeError } = await client
      .from('wrap_likes')
      .insert({
        wrap_id: id, // Supabase will handle UUID conversion
        ip_address: ipAddress,
      })

    if (likeError?.code === '23505') {
      console.log('User already liked this wrap')
      const wrap = await getWrap(id)
      if (!wrap) return { status: 'not_found' }
      return { status: 'already_liked', wrap }
    }

    if (likeError) {
      console.error('Error recording like:', likeError)
      return { status: 'not_found' }
    }

    console.log('Successfully inserted like record')

    const wrap = await getWrap(id)
    if (!wrap) return { status: 'not_found' }

    console.log('Successfully liked wrap, new likes count:', wrap.likes)
    return { status: 'liked', wrap }
  } catch (error) {
    console.error('Supabase not configured')
    return { status: 'not_found' }
  }
}

export async function unlikeWrap(id: string, ipAddress: string): Promise<Wrap | null> {
  // Supabase implementation
  try {
    const client = supabase // Use consistent client

    console.log('🔄 Unliking wrap:', id, 'for IP:', ipAddress)

    // First, check if the like exists
    const { data: existingLike, error: checkError } = await client
      .from('wrap_likes')
      .select('id')
      .eq('wrap_id', id)
      .eq('ip_address', ipAddress)
      .maybeSingle()

    console.log('Existing like check result:', { data: existingLike, error: checkError })

    if (checkError) {
      console.error('❌ Error checking existing like:', checkError)
      return null
    }

    if (!existingLike) {
      console.log('ℹ️ No like record found to delete for wrap:', id, 'IP:', ipAddress)
      // No record to delete, return current wrap without decrementing
      const wrap = await getWrap(id)
      return wrap // do not decrement
    }

    // Record exists, proceed with deletion and decrement
    console.log('✅ Found existing like record, deleting...')

    // Remove the like from wrap_likes table
    const { error: unlikeError } = await client
      .from('wrap_likes')
      .delete()
      .eq('wrap_id', id)
      .eq('ip_address', ipAddress)

    if (unlikeError) {
      console.error('❌ Error removing like:', unlikeError)
      return null
    }

    console.log('✅ Successfully deleted like record')

    // Get current likes
    const { data: currentWrap, error: wrapError } = await client
      .from('wraps')
      .select('likes')
      .eq('id', id)
      .single()

    if (wrapError || !currentWrap) {
      console.error('❌ Wrap not found after unlike:', wrapError)
      return null
    }

    console.log('📊 Current likes before decrement:', currentWrap.likes)

    // Decrement likes (prevent negative)
    const newLikes = Math.max(0, (currentWrap.likes || 0) - 1)
    console.log('📊 New likes count:', newLikes)

    const { data, error } = await client
      .from('wraps')
      .update({ likes: newLikes })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating likes count:', error)
      return null
    }

    console.log('✅ Successfully updated likes count to:', data.likes)

  return {
    id: data.id,
    authorId: data.author_id,
    carModelId: data.car_model_id,
    textureUrl: data.texture_url,
    previewRenderUrl: data.preview_render_url,
    title: data.title,
    description: data.description || undefined,
    username: data.username || undefined,
    likes: data.likes || 0,
    createdAt: data.created_at,
  }
  } catch (error) {
    console.error('❌ Supabase error in unlikeWrap:', error)
    return null
  }
}
