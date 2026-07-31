import { NextResponse } from 'next/server';
import { CarStatus as PrismaCarStatus, Prisma } from '@prisma/client'
import prisma from '@/lib/prisma';
import { ROLE_GROUPS } from '@/lib/rbac/access';
import { getAuthorizedUserIdByRoles } from '@/lib/auth-server'
import { generateMonthlyDocumentNumber } from '@/lib/document-number'

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
  const productId = String(body.productId ?? '').trim() || null
  const driverId = String(body.driverId ?? '').trim() || null
  const bookingUserId = String(body.userId ?? '').trim()
  const dateStart = new Date(body.dateStart)
  const dateEnd = new Date(body.dateEnd)
  const mileage = Number(body.mileage)

  if (!bookingUserId) return NextResponse.json({ message: 'userId is required' }, { status: 400 })
  if (Number.isNaN(dateStart.getTime()) || Number.isNaN(dateEnd.getTime())) {
    return NextResponse.json({ message: 'dateStart and dateEnd must be valid dates' }, { status: 400 })
  }

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const car = await tx.car.findFirst({
        where: { id: carId, isDeleted: false },
        select: { id: true, status: true, mileage: true },
      })
      if (!car) {
        throw new Error('Car not found')
      }
      if (mileage < car.mileage) {
        throw new Error('Car mileage less then now')
      }

      const user = await tx.user.findFirst({
        where: { id: bookingUserId, isDeleted: false },
        select: { id: true },
      })
      if (!user) {
        throw new Error('User not found')
      }

      if (productId) {
        const product = await tx.product.findFirst({
          where: { id: productId, isDeleted: false },
          select: { id: true },
        })
        if (!product) {
          throw new Error('Product not found')
        }
      }

      if (driverId) {
        const driver = await tx.driver.findFirst({
          where: { id: driverId, isDeleted: false },
          select: { id: true },
        })
        if (!driver) {
          throw new Error('Driver not found')
        }
      }

      if (car.status === 'Maintenance' || car.status === 'Unavailable' || car.status === 'Booked') {
        throw new Error('Car is not available for booking')
      }

      const created = await tx.booking.create({
        data: {
          productId,
          carId,
          userId: bookingUserId,
          driverId,
          dateStart,
          dateEnd,
          dateCount: Number(body.dateCount ?? 0),
          price: new Prisma.Decimal(body.price ?? 0),
          dailyRate: new Prisma.Decimal(body.dailyRate ?? 0),
          discountAmount: new Prisma.Decimal(body.discountAmount ?? 0),
          taxAmount: new Prisma.Decimal(body.taxAmount ?? 0),
          netAmount: new Prisma.Decimal(body.totalAmount ?? 0),
          remark: body.bookingRemark || null,
          status: body.bookingStatus,
          paymentImageId: body.bookingPaymentImagesId || null,
          healthCheck01ImageId: body.bookingHealthCheck01ImagesId || null,
          healthCheck02ImageId: body.bookingHealthCheck02ImagesId || null,
          contractNo: await generateMonthlyDocumentNumber({ model: 'booking', field: 'contractNo' }),
          createdBy: userId,
          updatedBy: userId,
        } as any,
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
        data: { status: PrismaCarStatus.Booked, mileage: mileage, updatedBy: userId },
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
    if (message === 'User not found') return NextResponse.json({ message }, { status: 404 })
    if (message === 'Product not found') return NextResponse.json({ message }, { status: 404 })
    if (message === 'Driver not found') return NextResponse.json({ message }, { status: 404 })
    if (message === 'Car is not available for booking') {
      return NextResponse.json({ message: 'รถคันนี้ไม่พร้อมสำหรับการจองแล้ว กรุณารีเฟรชข้อมูลรถ' }, { status: 409 })
    }
    if (message === 'Car status changed by another user') {
      return NextResponse.json({ message: 'รถคันนี้ถูกเปลี่ยนสถานะโดยผู้ใช้อื่น กรุณารีเฟรชข้อมูลรถ' }, { status: 409 })
    }
    if (message === 'Car mileage less then now') return NextResponse.json({ message: 'เลขไมล์ใหม่จะต้องมากกว่าหรือเท่ากับเลขไมล์ปัจจุบัน' }, { status: 409 })
    return NextResponse.json({ message: 'Failed to create booking' }, { status: 500 })
  }
}
