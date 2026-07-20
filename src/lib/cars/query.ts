import { Prisma } from '@prisma/client'
import { CarStatusOptions } from '@/lib/types'

export type CarListQuery = {
  inputSearch: string
  status: string
  brand: string
  vehicleType: string
  sort: string
}

export function parseCarListQuery(params: Record<string, string | string[] | undefined>): CarListQuery {
  const inputSearch = typeof params.inputSearch === 'string' ? params.inputSearch.trim() : ''
  const statusParam = typeof params.status === 'string' ? params.status : ''
  const status = CarStatusOptions.find((item) => item.value === statusParam)?.value ?? ''
  const brand = typeof params.brand === 'string' ? params.brand.trim() : ''
  const vehicleType = typeof params.vehicleType === 'string' ? params.vehicleType.trim() : ''
  const sort = typeof params.sort === 'string' ? params.sort : 'newest'

  return { inputSearch, status, brand, vehicleType, sort }
}

export function buildCarWhere(query: CarListQuery) {
  const where: any = { isDeleted: false }

  if (query.inputSearch) {
    where.OR = [
      { model: { contains: query.inputSearch, mode: 'insensitive' } },
      { license: { contains: query.inputSearch, mode: 'insensitive' } },
      { color: { contains: query.inputSearch, mode: 'insensitive' } },
      { engine: { contains: query.inputSearch, mode: 'insensitive' } },
      { chassis: { contains: query.inputSearch, mode: 'insensitive' } },
      { brand: { name: { contains: query.inputSearch, mode: 'insensitive' } } },
      { vehicleType: { name: { contains: query.inputSearch, mode: 'insensitive' } } },
    ]
  }

  if (query.status) where.status = query.status
  if (query.brand) where.brand = { name: { contains: query.brand, mode: 'insensitive' } }
  if (query.vehicleType) where.vehicleType = { name: { contains: query.vehicleType, mode: 'insensitive' } }

  return where
}

export function buildCarOrderBy(sort: string) {
  return (
    sort === 'model'
      ? { model: 'asc' }
      : sort === 'year'
        ? { year: 'desc' }
        : sort === 'mileage'
          ? { mileage: 'asc' }
          : { createdAt: 'desc' }
  ) satisfies Prisma.CarOrderByWithRelationInput
}
