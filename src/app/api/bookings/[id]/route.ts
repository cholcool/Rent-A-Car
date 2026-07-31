import { NextResponse } from 'next/server'
import { CarStatus as PrismaCarStatus } from '@prisma/client'
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

  const nextCarId = String(body.carId ?? '').trim()
  if (!nextCarId) return NextResponse.json({ message: 'carId is required' }, { status: 400 })

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const targetCar = await tx.car.findFirst({
        where: { id: nextCarId, isDeleted: false },
        select: { id: true, status: true, mileage: true },
      })
      if (!targetCar) {
        throw new Error('Car not found')
      }
      if (body.mileage < targetCar.mileage) {
        throw new Error('Car mileage less then now')
      }

      const targetCarUpdate = await tx.car.updateMany({
        where: { id: nextCarId, isDeleted: false, status: targetCar.status },
        data: { status: PrismaCarStatus.Booked, mileage: body.mileage, updatedBy: userId },
      })

      if (targetCarUpdate.count === 0) {
        throw new Error('Car status changed by another user')
      }

      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          productId: body.productId,
          carId: nextCarId,
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

      if (booking.carId !== nextCarId) {
        const releaseOld = await tx.car.updateMany({
          where: { id: booking.carId, isDeleted: false, status: PrismaCarStatus.Booked },
          data: { status: PrismaCarStatus.Available, mileage: body.mileage, updatedBy: userId },
        })
        if (releaseOld.count === 0) {
          throw new Error('Car status changed by another user')
        }
      }

      return updatedBooking
    })

    return NextResponse.json({ booking: updated })
  } catch (error: any) {
    const message = String(error?.message ?? '')
    if (message === 'Car not found') return NextResponse.json({ message }, { status: 404 })
    if (message === 'Car status changed by another user') {
      return NextResponse.json({ message: 'รถคันนี้ถูกเปลี่ยนสถานะโดยผู้ใช้อื่น กรุณารีเฟรชข้อมูลรถ' }, { status: 409 })
    }
    if (message === 'Car mileage less then now') return NextResponse.json({ message: 'เลขไมล์ใหม่จะต้องมากกว่าหรือเท่ากับเลขไมล์ปัจจุบัน' }, { status: 409 })
    return NextResponse.json({ message: 'Failed to update booking' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthorizedUserIdByRoles(ROLE_GROUPS.EDITORS)
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const booking = await prisma.booking.findFirst({ where: { id, isDeleted: false }, select: { carId: true } })
  if (!booking) return NextResponse.json({ message: 'Booking not found' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id },
      data: { isDeleted: true, updatedBy: userId },
    })
    await tx.car.update({
      where: { id: booking.carId },
      data: { status: PrismaCarStatus.Available, updatedBy: userId },
    })
  })

  return NextResponse.json({ ok: true })
}
