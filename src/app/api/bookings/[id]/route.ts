import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ROLE_GROUPS } from '@/lib/rbac/access'
import { getAuthorizedUserIdByRoles } from '@/lib/auth-server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthorizedUserIdByRoles(ROLE_GROUPS.EDITORS)
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const booking = await prisma.booking.findFirst({ where: { id, isDeleted: false } })
  if (!booking) return NextResponse.json({ message: 'Booking not found' }, { status: 404 })

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      productId: body.productId,
      carId: body.carId,
      userId: body.userId,
      driverId: body.driverId || null,
      dateStart: new Date(body.dateStart),
      dateEnd: new Date(body.dateEnd),
      dateCount: Number(body.dateCount ?? 0),
      price: body.price,
      dailyRate: body.dailyRate,
      discountAmount: body.discountAmount ?? 0,
      taxAmount: body.taxAmount ?? 0,
      netAmount: body.totalAmount,
      remark: body.bookingRemark || null,
      status: body.bookingStatus,
      paymentImageId: body.bookingPaymentImagesId || null,
      healthCheck01ImageId: body.bookingHealthCheck01ImagesId || null,
      healthCheck02ImageId: body.bookingHealthCheck02ImagesId || null,
      updatedBy: userId,
    },
    include: {
      user: true,
      car: { include: { brand: true } },
      driver: true,
      product: true,
      paymentImage: true,
      healthCheck01Image: true,
      healthCheck02Image: true,
    },
  })

  return NextResponse.json({ booking: updated })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthorizedUserIdByRoles(ROLE_GROUPS.EDITORS)
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.booking.update({
    where: { id },
    data: { isDeleted: true, updatedBy: userId },
  })

  return NextResponse.json({ ok: true })
}
