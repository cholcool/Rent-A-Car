import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma';
import { ROLE_GROUPS } from '@/lib/rbac/access';
import { getAuthorizedUserIdByRoles } from '@/lib/auth-server'
import { buildCarOrderBy, buildCarWhere, parseCarListQuery } from '@/lib/cars/query'
import { serializePrismaRows } from '@/lib/serialize'

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function GET(request: Request) {
  const userId = await getAuthorizedUserIdByRoles(ROLE_GROUPS.EDITORS)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const query = parseCarListQuery(Object.fromEntries(url.searchParams.entries()))

  const cars = await prisma.car.findMany({
    where: buildCarWhere(query),
    orderBy: buildCarOrderBy(query.sort),
    include: {
      brand: true,
      vehicleType: true,
      maintenances: true,
      images: {
        include: { image: true },
        orderBy: { number: 'asc' },
      },
    },
  } satisfies Prisma.CarFindManyArgs);
  return NextResponse.json(serializePrismaRows(cars));
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
