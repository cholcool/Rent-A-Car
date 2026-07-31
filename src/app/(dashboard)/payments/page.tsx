import prisma from '@/lib/prisma'
import { serializePrismaRows } from '@/lib/serialize'
import PaymentsClient from './payments-client'

export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
  const bookings = await prisma.booking.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: true,
      car: { include: { brand: true } },
      payments: {
        where: { isDeleted: false },
        orderBy: { paymentDate: 'desc' },
      },
    },
  })

  return <PaymentsClient initialBookings={serializePrismaRows(bookings)} />
}
