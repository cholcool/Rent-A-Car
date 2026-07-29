import { BookingStatus } from '@prisma/client'
import { getStatusLabel } from '@/lib/ui-format'

export type PrismaBookingStatus = BookingStatus

export type BookingOption = { id: string; value: string; label: string; price?: number; status?: string; mileage?: number; }

export type BookingStatusOption = { value: BookingStatus; label: any; }

export const BookingStatusOptions: BookingStatusOption[] = [
  { value: BookingStatus.Pending, label: getStatusLabel(BookingStatus.Pending) },
  { value: BookingStatus.InProgress, label: getStatusLabel(BookingStatus.InProgress) },
  { value: BookingStatus.Confirmed, label: getStatusLabel(BookingStatus.Confirmed) },
  { value: BookingStatus.Completed, label: getStatusLabel(BookingStatus.Completed) },
  { value: BookingStatus.Cancelled, label: getStatusLabel(BookingStatus.Cancelled) },
  { value: BookingStatus.Rejected, label: getStatusLabel(BookingStatus.Rejected) },
];

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