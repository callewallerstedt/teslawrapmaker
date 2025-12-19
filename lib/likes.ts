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

async function recomputeAndPersistWrapLikes(client: ReturnType<typeof getClient>, wrapId: string) {
  const { count, error: countError } = await client
    .from('wrap_likes')
    .select('id', { count: 'exact', head: true })
    .eq('wrap_id', wrapId)

  if (countError) {
    console.error('Error counting likes:', countError)
    return null
  }

  const likes = count ?? 0
  const { error: updateError } = await client
    .from('wraps')
    .update({ likes })
    .eq('id', wrapId)

  if (updateError) {
    console.error('Error updating wrap likes count:', updateError)
    // Still return computed likes so UI can be correct even if denormalized column update failed
  }

  return likes
}

/**
 * Toggle like status for a wrap (atomic operation)
 * If user has liked -> unlike
 * If user hasn't liked -> like
 */
export async function toggleWrapLike(wrapId: string, userKey: string): Promise<LikeResult> {
  try {
    const client = getClient()

    // Check current like status
    const { data: existingLikes, error: existingError } = await client
      .from('wrap_likes')
      .select('id')
      .eq('wrap_id', wrapId)
      .eq('ip_address', userKey)
      .order('id', { ascending: true })

    if (existingError) {
      console.error('Error checking existing likes:', existingError)
      return { success: false, liked: false, likes: 0, error: 'Failed to check like status' }
    }

    if ((existingLikes?.length ?? 0) > 0) {
      // User has liked - remove the like
      const { error: deleteError } = await client
        .from('wrap_likes')
        .delete()
        .eq('wrap_id', wrapId)
        .eq('ip_address', userKey)

      if (deleteError) {
        console.error('Error deleting like:', deleteError)
        return { success: false, liked: true, likes: 0, error: 'Failed to unlike' }
      }

      const likes = await recomputeAndPersistWrapLikes(client, wrapId)
      if (likes === null) {
        return { success: false, liked: false, likes: 0, error: 'Failed to update likes' }
      }

      return { success: true, liked: false, likes }
    } else {
      // User hasn't liked - add the like
      const { error: insertError } = await client
        .from('wrap_likes')
        .insert({ wrap_id: wrapId, ip_address: userKey })

      if (insertError) {
        // Handle duplicate key error gracefully
        if (insertError.code === '23505') {
          // Already liked (race condition), recompute to be safe
          const likes = await recomputeAndPersistWrapLikes(client, wrapId)
          return { success: true, liked: true, likes: likes ?? 0 }
        }
        console.error('Error inserting like:', insertError)
        return { success: false, liked: false, likes: 0, error: 'Failed to like' }
      }

      // Defensive cleanup: if multiple like rows exist for this userKey, keep only one.
      const { data: likesForUser, error: likesForUserError } = await client
        .from('wrap_likes')
        .select('id')
        .eq('wrap_id', wrapId)
        .eq('ip_address', userKey)
        .order('id', { ascending: true })

      if (likesForUserError) {
        console.error('Error fetching user likes for cleanup:', likesForUserError)
      } else if ((likesForUser?.length ?? 0) > 1) {
        const idsToDelete = likesForUser!.slice(1).map((row) => row.id)
        const { error: cleanupError } = await client
          .from('wrap_likes')
          .delete()
          .in('id', idsToDelete)
        if (cleanupError) {
          console.error('Error cleaning up duplicate likes:', cleanupError)
        }
      }

      const likes = await recomputeAndPersistWrapLikes(client, wrapId)
      if (likes === null) {
        return { success: false, liked: true, likes: 0, error: 'Failed to update likes' }
      }

      return { success: true, liked: true, likes }
    }
  } catch (error) {
    console.error('Toggle like error:', error)
    return { success: false, liked: false, likes: 0, error: 'Internal error' }
  }
}

/**
 * Check if user has liked a wrap
 */
export async function checkUserLiked(wrapId: string, userKey: string): Promise<boolean> {
  try {
    const client = getClient()
    const { data, error } = await client
      .from('wrap_likes')
      .select('id')
      .eq('wrap_id', wrapId)
      .eq('ip_address', userKey)
      .limit(1)

    if (error) {
      console.error('Check liked error:', error)
      return false
    }

    return (data?.length ?? 0) > 0
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
