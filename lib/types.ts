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
}

export interface Wrap {
  id: string
  authorId?: string
  carModelId: string
  textureUrl: string
  previewRenderUrl?: string
  title: string
  description?: string
  username?: string
  likes: number
  createdAt: string
}

export interface TextureMergeRequest {
  baseTextureUrl: string
  layers: Layer[]
}


