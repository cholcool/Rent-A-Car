import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import BookingsClient from './bookings-client'

export const dynamic = 'force-dynamic'

export default async function BookingsPage() {
  const session = await auth()
  const currentUserId = session?.user?.id ?? ''

  const [bookings, products, cars, drivers] = await Promise.all([
    prisma.booking.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        car: { include: { brand: true } },
        driver: true,
        product: true,
        paymentImage: true,
        healthCheck01Image: true,
        healthCheck02Image: true,
      },
    }),
    prisma.product.findMany({
      where: { isDeleted: false, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, price: true },
    }),
    prisma.car.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      select: { id: true, model: true, license: true, brand: { select: { name: true } } },
    }),
    prisma.driver.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      select: { id: true, fullName: true, phone: true },
    }),
  ])

  return (
    <BookingsClient
      initialBookings={bookings}
      currentUserId={currentUserId}
      products={products.map((product) => ({ id: product.id, label: `${product.name} - ${product.price}` , price: Number(product.price) }))}
      cars={cars.map((car) => ({ id: car.id, label: `${car.brand.name} ${car.model} (${car.license})` }))}
      drivers={drivers.map((driver) => ({ id: driver.id, label: `${driver.fullName} (${driver.phone})` }))}
    />
  )
}
