import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ROLE_GROUPS, hasAnyRole } from '@/lib/rbac/access'

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
    guarantor: driver.guarantor
      ? {
          id: driver.guarantor.id,
          fullName: driver.guarantor.fullName,
          phone: driver.guarantor.phone,
          remark: driver.guarantor.remark ?? null,
          cardImageId: driver.guarantor.cardImageId ?? null,
          licenseImageId: driver.guarantor.licenseImageId ?? null,
          cardImage: driver.guarantor.cardImage ?? null,
          licenseImage: driver.guarantor.licenseImage ?? null,
        }
      : null,
  }
}

function hasGuarantor(body: any) {
  const fullName = normalize(body?.guarantor?.fullName)
  const phone = normalize(body?.guarantor?.phone)
  const remark = normalize(body?.guarantor?.remark)
  const cardImageId = normalize(body?.guarantor?.cardImageId)
  const licenseImageId = normalize(body?.guarantor?.licenseImageId)

  const provided = [fullName, phone, remark, cardImageId, licenseImageId].some((value) => value)

  return {
    provided,
    data: {
      fullName: fullName || '',
      phone: phone || '',
      remark: remark || null,
      cardImageId: cardImageId || null,
      licenseImageId: licenseImageId || null,
    },
  }
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const drivers = await prisma.driver.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: 'desc' },
    include: {
      cardImage: true,
      licenseImage: true,
      guarantor: {
        include: {
          cardImage: true,
          licenseImage: true,
        },
      },
    },
  })
  return NextResponse.json(drivers.map(mapDriver))
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

  const guarantorInput = hasGuarantor(body)

  if (guarantorInput.provided && (!guarantorInput.data.fullName || !guarantorInput.data.phone)) {
    return NextResponse.json({ error: 'guarantor fullName and phone are required' }, { status: 400 })
  }

  const driver = await prisma.$transaction(async (tx) => {
    const createdDriver = await tx.driver.create({
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
        cardImage: true,
        licenseImage: true,
      },
    })

    let guarantor = null
    if (guarantorInput.provided) {
      guarantor = await tx.guarantor.create({
        data: {
          driverId: createdDriver.id,
          fullName: guarantorInput.data.fullName,
          phone: guarantorInput.data.phone,
          remark: guarantorInput.data.remark,
          cardImageId: guarantorInput.data.cardImageId,
          licenseImageId: guarantorInput.data.licenseImageId,
          createdBy: userId,
          updatedBy: userId,
        },
        include: {
          cardImage: true,
          licenseImage: true,
        },
      })
    }

    return { ...createdDriver, guarantor }
  })

  return NextResponse.json({ driver: mapDriver(driver) })
}

export async function PATCH(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const id = normalize(body.id)
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const guarantorInput = hasGuarantor(body)

  if (guarantorInput.provided && (!guarantorInput.data.fullName || !guarantorInput.data.phone)) {
    return NextResponse.json({ error: 'guarantor fullName and phone are required' }, { status: 400 })
  }

  const driver = await prisma.$transaction(async (tx) => {
    const updatedDriver = await tx.driver.update({
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
        cardImage: true,
        licenseImage: true,
      },
    })

    const existingGuarantor = await tx.guarantor.findUnique({ where: { driverId: id } })

    if (!guarantorInput.provided) {
      if (existingGuarantor) {
        await tx.guarantor.delete({ where: { id: existingGuarantor.id } })
      }
      return { ...updatedDriver, guarantor: null }
    }

    const guarantorData = {
      fullName: guarantorInput.data.fullName,
      phone: guarantorInput.data.phone,
      remark: guarantorInput.data.remark,
      cardImageId: guarantorInput.data.cardImageId,
      licenseImageId: guarantorInput.data.licenseImageId,
      updatedBy: userId,
    }

    const guarantor = existingGuarantor
      ? await tx.guarantor.update({
          where: { id: existingGuarantor.id },
          data: guarantorData,
          include: {
            cardImage: true,
            licenseImage: true,
          },
        })
      : await tx.guarantor.create({
          data: {
            driverId: id,
            ...guarantorData,
            createdBy: userId,
          },
          include: {
            cardImage: true,
            licenseImage: true,
          },
        })

    return { ...updatedDriver, guarantor }
  })

  return NextResponse.json({ driver: mapDriver(driver) })
}

export async function DELETE(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const id = normalize(body.id)
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  await prisma.$transaction(async (tx) => {
    const guarantor = await tx.guarantor.findUnique({ where: { driverId: id } })
    if (guarantor) {
      await tx.guarantor.delete({ where: { id: guarantor.id } })
    }

    await tx.driver.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedBy: userId,
      },
    })
  })

  return NextResponse.json({ ok: true })
}
