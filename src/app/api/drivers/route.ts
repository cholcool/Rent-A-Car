import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function getUserId() {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, roles: { select: { role: { select: { code: true } } } } } })
  const roles = (user?.roles ?? []).map((entry) => entry.role.code)
  if (!user?.id || !roles.some((role) => ['ADMIN', 'MANAGER', 'AGENT'].includes(role))) return null
  return user.id
}

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function mapDriver(driver: any) {
  return {
    id: driver.id,
    fullName: driver.fullName,
    phone: driver.phone,
    remark: driver.remark ?? '',
    cardImageId: driver.cardImageId ?? '',
    licenseImageId: driver.licenseImageId ?? '',
    cardImage: driver.cardImage ?? null,
    licenseImage: driver.licenseImage ?? null,
  }
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const drivers = await prisma.driver.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(drivers.map(mapDriver));
}

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const fullName = normalize(body.fullName)
  const phone = normalize(body.phone)
  const remark = normalize(body.remark)
  const cardImageId = normalize(body.cardImageId) || null
  const licenseImageId = normalize(body.licenseImageId) || null

  if (!fullName) return NextResponse.json({ error: 'fullName is required' }, { status: 400 })
  if (!phone) return NextResponse.json({ error: 'phone is required' }, { status: 400 })

  const driver = await prisma.driver.create({
    data: {
      fullName,
      phone,
      remark: remark || null,
      cardImageId,
      licenseImageId,
      createdBy: userId,
      updatedBy: userId,
    },
    include: {
      cardImage: { select: { id: true, url: true, name: true } },
      licenseImage: { select: { id: true, url: true, name: true } },
    },
  })

  return NextResponse.json({ driver: mapDriver(driver) })
}

export async function PATCH(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const id = normalize(body.id)
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const driver = await prisma.driver.update({
    where: { id },
    data: {
      fullName: normalize(body.fullName),
      phone: normalize(body.phone),
      remark: normalize(body.remark) || null,
      cardImageId: normalize(body.cardImageId) || null,
      licenseImageId: normalize(body.licenseImageId) || null,
      updatedBy: userId,
    },
    include: {
      cardImage: { select: { id: true, url: true, name: true } },
      licenseImage: { select: { id: true, url: true, name: true } },
    },
  })

  return NextResponse.json({ driver: mapDriver(driver) })
}

export async function DELETE(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const id = normalize(body.id)
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  await prisma.driver.update({
    where: { id },
    data: {
      isDeleted: true,
      updatedBy: userId,
    },
  })

  return NextResponse.json({ ok: true })
}
