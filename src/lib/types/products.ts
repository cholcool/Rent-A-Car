export type ProductRow = {
  id: string
  products_name: string
  products_desc: string
  products_remark: string
  products_price: number
  date_start: string
  date_end: string
  date_count: number
  is_active: boolean
}

export type ProductFormState = {
  products_name: string
  products_desc: string
  products_remark: string
  products_price: string
  date_start: string
  date_end: string
  date_count: number
  is_active: boolean
}

export const ProductEmptyForm: ProductFormState = {
  products_name: '',
  products_desc: '',
  products_remark: '',
  products_price: '0',
  date_start: '',
  date_end: '',
  date_count: 0,
  is_active: true,
}