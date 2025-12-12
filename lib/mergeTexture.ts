import sharp from 'sharp'
import { Layer } from './types'

export async function mergeTexture(
  baseTextureBuffer: Buffer,
  layers: Layer[]
): Promise<Buffer> {
  let image = sharp(baseTextureBuffer)
  const composites: sharp.OverlayOptions[] = []

  // Process each layer
  for (const layer of layers) {
    // Fetch the layer image
    const layerResponse = await fetch(layer.imageUrl)
    const layerBuffer = Buffer.from(await layerResponse.arrayBuffer())

    // Get original dimensions to calculate scale
    const metadata = await sharp(layerBuffer).metadata()
    const width = metadata.width || 100
    const height = metadata.height || 100

    // Process layer with transformations
    const processedLayer = await sharp(layerBuffer)
      .resize(
        Math.round(width * layer.scaleX),
        Math.round(height * layer.scaleY),
        { fit: 'fill' }
      )
      .rotate(layer.rotation)
      .ensureAlpha()
      .toBuffer()

    composites.push({
      input: processedLayer,
      left: Math.round(layer.x),
      top: Math.round(layer.y),
      blend: 'over',
    })
  }

  // Apply all composites at once
  if (composites.length > 0) {
    image = image.composite(composites)
  }

  return image.png().toBuffer()
}

