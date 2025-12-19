export interface CarModel {
  id: string
  name: string
  previewImage: string
  uvTextureUrl: string
  meshModelUrl: string
}

export interface Layer {
  id: string
  imageUrl: string
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
  opacity: number
  recolor?: string | null // hex color, e.g. #ff0000
  totalRecolor?: boolean // replace all non-transparent pixels with recolor
  flipX?: boolean // mirror horizontally
  flipY?: boolean // mirror vertically
  crop?: {
    x: number // source pixels from left
    y: number // source pixels from top
    width: number // source pixels
    height: number // source pixels
  } | null
}

export interface Wrap {
  id: string
  authorId?: string
  carModelId: string
  textureUrl: string
  previewRenderUrl?: string
  title: string
  description?: string // Not stored in database
  username?: string // Stored in database, defaults to 'user'
  likes: number
  createdAt: string
}

export interface TextureMergeRequest {
  baseTextureUrl: string
  layers: Layer[]
}
