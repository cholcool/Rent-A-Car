import { Prisma, CarStatus as PrismaCarStatus } from '@prisma/client'

export type CarStatus = PrismaCarStatus

export const CarStatusOptions = [
  { value: PrismaCarStatus.Available, label: 'พร้อมให้เช่า' },
  { value: PrismaCarStatus.Booked, label: 'จองแล้ว' },
  { value: PrismaCarStatus.Maintenance, label: 'บำรุงรักษา' },
  { value: PrismaCarStatus.Unavailable, label: 'ไม่พร้อมใช้' },
  { value: PrismaCarStatus.Reserved, label: 'จองสำรอง' },
] as const

export type CarsRow = Prisma.CarGetPayload<{
  include: {
    brand: true,
    vehicleType: true,
    maintenances: true,
    images: {
      include: {
        image: true
      }
    }
  }
}>
