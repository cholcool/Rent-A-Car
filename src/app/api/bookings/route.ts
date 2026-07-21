import { NextResponse } from 'next/server';
import { CarStatus as PrismaCarStatus } from '@prisma/client'
import prisma from '@/lib/prisma';
import { ROLE_GROUPS } from '@/lib/rbac/access';
import { getAuthorizedUserIdByRoles } from '@/lib/auth-server'

export async function GET() {
  const userId = await getAuthorizedUserIdByRoles(ROLE_GROUPS.EDITORS)
  if (!userId)
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const bookings = await prisma.booking.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: 'desc' },
    include: {
      car: { include: { brand: true } },
      user: true,
      driver: true,
      product: true,
      paymentImage: true,
      healthCheck01Image: true,
      healthCheck02Image: true,
    },
  });
  return NextResponse.json(bookings);
}

export async function POST(request: Request) {
  const userId = await getAuthorizedUserIdByRoles(ROLE_GROUPS.EDITORS)
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const carId = String(body.carId ?? '').trim()
  if (!carId) return NextResponse.json({ message: 'carId is required' }, { status: 400 })

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const car = await tx.car.findFirst({
        where: { id: carId, isDeleted: false },
        select: { id: true, status: true },
      })
      if (!car) {
        throw new Error('Car not found')
      }

      if (car.status === 'Maintenance' || car.status === 'Unavailable' || car.status === 'Booked') {
        throw new Error('Car is not available for booking')
      }

      const created = await tx.booking.create({
        data: {
          productId: body.productId,
          carId,
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
          createdBy: userId,
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

      const carUpdate = await tx.car.updateMany({
        where: { id: carId, isDeleted: false, status: car.status },
        data: { status: PrismaCarStatus.Booked, updatedBy: userId },
      })

      if (carUpdate.count === 0) {
        throw new Error('Car status changed by another user')
      }

      return created
    })

    return NextResponse.json({ booking })
  } catch (error: any) {
    const message = String(error?.message ?? '')
    if (message === 'Car not found') return NextResponse.json({ message }, { status: 404 })
    if (message === 'Car is not available for booking') {
      return NextResponse.json({ message: 'รถคันนี้ไม่พร้อมสำหรับการจองแล้ว กรุณารีเฟรชข้อมูลรถ' }, { status: 409 })
    }
    if (message === 'Car status changed by another user') {
      return NextResponse.json({ message: 'รถคันนี้ถูกเปลี่ยนสถานะโดยผู้ใช้อื่น กรุณารีเฟรชข้อมูลรถ' }, { status: 409 })
    }
    return NextResponse.json({ message: 'Failed to create booking' }, { status: 500 })
  }
}
