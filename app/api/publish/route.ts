import { NextRequest, NextResponse } from 'next/server'
import { createWrap } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const title = formData.get('title') as string
    const carModelId = formData.get('carModelId') as string
    const textureFile = formData.get('texture') as File
    const description = (formData.get('description') as string) || ''
    const username = (formData.get('username') as string) || ''

    if (!title || !carModelId || !textureFile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL

    let textureUrl: string

    if (useSupabase) {
      // Compress image using Sharp before uploading
      const bytes = await textureFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Compress PNG with high quality but smaller file size
      const compressedBuffer = await sharp(buffer)
        .png({
          quality: 90, // High quality (0-100)
          compressionLevel: 9, // Maximum compression
          adaptiveFiltering: true,
        })
        .toBuffer()

      console.log(`Compressed: ${buffer.length} → ${compressedBuffer.length} bytes (${Math.round((1 - compressedBuffer.length / buffer.length) * 100)}% reduction)`)

      // Upload compressed image to Supabase Storage
      const fileExt = 'png'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `wraps/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('wraps')
        .upload(filePath, compressedBuffer, {
          contentType: 'image/png',
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload texture' },
          { status: 500 }
        )
      }

      const { data: urlData } = supabase.storage
        .from('wraps')
        .getPublicUrl(filePath)

      textureUrl = urlData.publicUrl
    } else {
      // Fallback: compress even for data URLs
      const bytes = await textureFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const compressedBuffer = await sharp(buffer)
        .png({
          quality: 90,
          compressionLevel: 9,
          adaptiveFiltering: true,
        })
        .toBuffer()

      const base64 = compressedBuffer.toString('base64')
      textureUrl = `data:image/png;base64,${base64}`
    }

    const wrap = await createWrap({
      carModelId,
      textureUrl,
      title,
      description: description || undefined,
      username: username || undefined,
    })

    return NextResponse.json(wrap)
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json({ error: 'Publish failed' }, { status: 500 })
  }
}


