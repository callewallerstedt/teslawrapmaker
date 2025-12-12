// Clean likes implementation - single source of truth
import { supabase, supabaseAdmin } from './supabase'

// Use admin client for server operations if available, otherwise fall back to anon client
const getClient = () => supabaseAdmin || supabase

export interface LikeResult {
  success: boolean
  liked: boolean
  likes: number
  error?: string
}

/**
 * Toggle like status for a wrap (atomic operation)
 * If user has liked -> unlike
 * If user hasn't liked -> like
 */
export async function toggleWrapLike(wrapId: string, ipAddress: string): Promise<LikeResult> {
  try {
    const client = getClient()

    // Check current like status
    const { data: existingLike } = await client
      .from('wrap_likes')
      .select('id')
      .eq('wrap_id', wrapId)
      .eq('ip_address', ipAddress)
      .maybeSingle()

    if (existingLike) {
      // User has liked - remove the like
      const { error: deleteError } = await client
        .from('wrap_likes')
        .delete()
        .eq('wrap_id', wrapId)
        .eq('ip_address', ipAddress)

      if (deleteError) {
        console.error('Error deleting like:', deleteError)
        return { success: false, liked: true, likes: 0, error: 'Failed to unlike' }
      }

      // Decrement likes count
      const { data: wrap, error: updateError } = await client
        .from('wraps')
        .select('likes')
        .eq('id', wrapId)
        .single()

      if (updateError || !wrap) {
        return { success: false, liked: false, likes: 0, error: 'Wrap not found' }
      }

      const newLikes = Math.max(0, (wrap.likes || 0) - 1)
      await client
        .from('wraps')
        .update({ likes: newLikes })
        .eq('id', wrapId)

      return { success: true, liked: false, likes: newLikes }
    } else {
      // User hasn't liked - add the like
      const { error: insertError } = await client
        .from('wrap_likes')
        .insert({ wrap_id: wrapId, ip_address: ipAddress })

      if (insertError) {
        // Handle duplicate key error gracefully
        if (insertError.code === '23505') {
          // Already liked (race condition), return current state
          const { data: wrap } = await client
            .from('wraps')
            .select('likes')
            .eq('id', wrapId)
            .single()
          return { success: true, liked: true, likes: wrap?.likes || 0 }
        }
        console.error('Error inserting like:', insertError)
        return { success: false, liked: false, likes: 0, error: 'Failed to like' }
      }

      // Increment likes count
      const { data: wrap, error: updateError } = await client
        .from('wraps')
        .select('likes')
        .eq('id', wrapId)
        .single()

      if (updateError || !wrap) {
        return { success: false, liked: true, likes: 0, error: 'Wrap not found' }
      }

      const newLikes = (wrap.likes || 0) + 1
      await client
        .from('wraps')
        .update({ likes: newLikes })
        .eq('id', wrapId)

      return { success: true, liked: true, likes: newLikes }
    }
  } catch (error) {
    console.error('Toggle like error:', error)
    return { success: false, liked: false, likes: 0, error: 'Internal error' }
  }
}

/**
 * Check if user has liked a wrap
 */
export async function checkUserLiked(wrapId: string, ipAddress: string): Promise<boolean> {
  try {
    const client = getClient()
    const { data } = await client
      .from('wrap_likes')
      .select('id')
      .eq('wrap_id', wrapId)
      .eq('ip_address', ipAddress)
      .maybeSingle()

    return !!data
  } catch (error) {
    console.error('Check liked error:', error)
    return false
  }
}

/**
 * Get current likes count for a wrap
 */
export async function getWrapLikes(wrapId: string): Promise<number> {
  try {
    const client = getClient()
    const { data } = await client
      .from('wraps')
      .select('likes')
      .eq('id', wrapId)
      .single()

    return data?.likes || 0
  } catch (error) {
    console.error('Get likes error:', error)
    return 0
  }
}

