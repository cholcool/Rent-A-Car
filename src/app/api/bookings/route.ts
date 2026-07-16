import { NextResponse } from 'next/server';
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
  const booking = await prisma.booking.create({
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
  });

  return NextResponse.json({ booking });
}
