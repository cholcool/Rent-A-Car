import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ROLE_GROUPS } from '@/lib/rbac/access';
import { getAuthorizedUserIdByRoles } from '@/lib/auth-server'

export async function GET() {
  const userId = await getAuthorizedUserIdByRoles(ROLE_GROUPS.ADMIN_STAFF)
  if (!userId)
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    include: { booking: true },
  });
  return NextResponse.json(payments);
}
