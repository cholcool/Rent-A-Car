import { UploadedImage } from '@/lib/types'

export type DriverRow = {
  id: string
  fullName: string
  phone: string
  remark: string | null
  cardImageId: string
  licenseImageId: string
  cardImage: UploadedImage | null
  licenseImage: UploadedImage | null
}

export type DriverFormState = {
  fullName: string
  phone: string
  remark: string | null
  cardImageId: string | null
  licenseImageId: string | null
}

export const DriverEmptyForm: DriverFormState = {
  fullName: '',
  phone: '',
  remark: null,
  cardImageId: null,
  licenseImageId: null,
}
