import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ROLE_GROUPS, hasAnyRole } from '@/lib/rbac/access';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { roles: { include: { role: true } } },
  });
  const roles = (user?.roles ?? []).map((ur: any) => ur.role.code);
  if (!hasAnyRole(roles, ROLE_GROUPS.EDITORS))
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
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

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
      createdBy: user.id,
      updatedBy: user.id,
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
