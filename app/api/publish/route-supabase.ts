import { NextRequest, NextResponse } from 'next/server'
import { createWrap } from '@/lib/db-supabase'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const title = formData.get('title') as string
    const carModelId = formData.get('carModelId') as string
    const textureFile = formData.get('texture') as File

    if (!title || !carModelId || !textureFile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = textureFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `wraps/${fileName}`

    // Convert file to buffer
    const bytes = await textureFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('wraps')
      .upload(filePath, buffer, {
        contentType: textureFile.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload texture' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('wraps')
      .getPublicUrl(filePath)

    const textureUrl = urlData.publicUrl

    // Create wrap record in database
    const wrap = await createWrap({
      carModelId,
      textureUrl,
      title,
    })

    return NextResponse.json(wrap)
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json({ error: 'Publish failed' }, { status: 500 })
  }
}

