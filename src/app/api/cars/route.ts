import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ROLE_GROUPS, hasAnyRole } from '@/lib/rbac/access';


async function getUserId() {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, roles: { select: { role: { select: { code: true } } } } } })
  const roles = (user?.roles ?? []).map((entry) => entry.role.code)
  if (!user?.id || !hasAnyRole(roles, ROLE_GROUPS.EDITORS)) return null
  return user.id
}

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cars = await prisma.car.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(cars);
}

export async function DELETE(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const id = normalize(body.id)
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  await prisma.car.update({
    where: { id },
    data: {
      isDeleted: true,
      updatedBy: userId,
    },
  })

  return NextResponse.json({ ok: true })
}
