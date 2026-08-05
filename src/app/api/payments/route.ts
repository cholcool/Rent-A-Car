import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCachedSession } from '@/lib/auth'

export async function GET() {
  const session = await getCachedSession();
  const userId = session?.user?.id
  if (!userId)
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const payments = await prisma.payment.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: 'desc' },
    include: { booking: true },
  });
  return NextResponse.json(payments);
}
