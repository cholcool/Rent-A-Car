export type UploadedImage = {
  id: string
  url: string
  name: string
}

export type ImageType = {
  id: string
  key: string
  url: string
  name: string
  size?: number
  type?: string
  remark?: string
}