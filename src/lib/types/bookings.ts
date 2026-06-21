import { BookingStatus as PrismaBookingStatus } from '@prisma/client'

export type BookingStatus = PrismaBookingStatus

export type BookingOption = { id: string; label: string; price?: number }

export interface BookingFormType {
  productId: string
  carId: string
  userId: string
  driverId: string
  dateStart: string
  dateEnd: string
  price: string
  discountAmount: string
  taxAmount: string
  bookingStatus: BookingStatus
  bookingRemark: string
  paymentImageId: string
  healthCheck01ImageId: string
  healthCheck02ImageId: string
}