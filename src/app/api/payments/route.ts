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
  if (!hasAnyRole(roles, ROLE_GROUPS.ADMIN_STAFF))
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    include: { booking: true },
  });
  return NextResponse.json(payments);
}
