import { Prisma } from '@prisma/client'

type SerializableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SerializableValue[]
  | { [key: string]: SerializableValue }

export function serializePrismaValue<T>(value: T): any {
  if (value instanceof Prisma.Decimal) {
    return value.toNumber()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializePrismaValue(item))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, serializePrismaValue(item)])
    )
  }

  return value as SerializableValue
}

export function serializePrismaRows<T>(rows: T[]): T[] {
  return rows.map((row) => serializePrismaValue(row)) as T[]
}
