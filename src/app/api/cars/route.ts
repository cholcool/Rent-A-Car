import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ROLE_GROUPS } from '@/lib/rbac/access';
import { getAuthorizedUserIdByRoles } from '@/lib/auth-server'

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function GET() {
  const userId = await getAuthorizedUserIdByRoles(ROLE_GROUPS.EDITORS)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cars = await prisma.car.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(cars);
}

export async function DELETE(request: Request) {
  const userId = await getAuthorizedUserIdByRoles(ROLE_GROUPS.EDITORS)
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
