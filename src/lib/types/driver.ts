import { ImageType } from '@/lib/types'

export type DriverFormState = {
  fullName: string
  phone: string
  remark: string | null
  cardImageId: string | null
  licenseImageId: string | null
}

export type GuarantorFormState = {
  fullName: string
  phone: string
  remark: string | null
  cardImageId: string | null
  licenseImageId: string | null
}

export type DriverRow = {
  id: string
  fullName: string
  phone: string
  remark: string | null
  cardImageId: string | null
  licenseImageId: string | null
  cardImage: ImageType | null
  licenseImage: ImageType | null
  guarantor: GuarantorRow | null
}

export type GuarantorRow = {
  id: string
  fullName: string
  phone: string
  remark: string | null
  cardImageId: string | null
  licenseImageId: string | null
  cardImage: ImageType | null
  licenseImage: ImageType | null
}

export const DriverEmptyForm: DriverFormState = {
  fullName: '',
  phone: '',
  remark: null,
  cardImageId: null,
  licenseImageId: null,
}

export const GuarantorEmptyForm: GuarantorFormState = {
  fullName: '',
  phone: '',
  remark: null,
  cardImageId: null,
  licenseImageId: null,
}
