import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ROLE_GROUPS, hasAnyRole } from '@/lib/rbac/access'

function parseDateOnly(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function parseBody(body: unknown) {
  return (body ?? {}) as Record<string, unknown>
}

async function getAuthorizedUserId() {
  const session = await auth()
  if (!session?.user?.email) return null

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, roles: { select: { role: { select: { code: true } } } } },
  })

  const roles = (user?.roles ?? []).map((entry) => entry.role.code)
  if (!user?.id || !hasAnyRole(roles, ROLE_GROUPS.EDITORS)) return null
  return user.id
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthorizedUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = parseBody(await request.json())
    const products_name = String(body.products_name ?? '').trim()
    const products_desc = String(body.products_desc ?? '').trim()
    const products_remark = String(body.products_remark ?? '').trim()
    const products_price = Number(body.products_price ?? 0)
    const date_start = parseDateOnly(body.date_start)
    const date_end = parseDateOnly(body.date_end)
    const date_count = Number(body.date_count ?? 0)
    const is_active = Boolean(body.is_active ?? true)

    if (!products_name) return NextResponse.json({ error: 'products_name is required' }, { status: 400 })
    if (!date_start || !date_end) return NextResponse.json({ error: 'date_start and date_end are required' }, { status: 400 })

    const product = await prisma.product.create({
      data: {
        name: products_name,
        description: products_desc || null,
        remark: products_remark || null,
        price: new Prisma.Decimal(products_price || 0),
        dateStart: date_start,
        dateEnd: date_end,
        dateCount: Number.isFinite(date_count) ? date_count : 0,
        isActive: is_active,
        isDeleted: false,
        createdBy: userId,
        updatedBy: userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        remark: true,
        price: true,
        dateStart: true,
        dateEnd: true,
        dateCount: true,
        isActive: true,
      },
    })

    return NextResponse.json({
      product: {
        id: product.id,
        products_name: product.name,
        products_desc: product.description ?? '',
        products_remark: product.remark ?? '',
        products_price: Number(product.price),
        date_start: product.dateStart.toISOString(),
        date_end: product.dateEnd.toISOString(),
        date_count: product.dateCount,
        is_active: product.isActive,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getAuthorizedUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = parseBody(await request.json())
    const id = String(body.id ?? '').trim()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: String(body.products_name ?? '').trim(),
        description: String(body.products_desc ?? '').trim() || null,
        remark: String(body.products_remark ?? '').trim() || null,
        price: new Prisma.Decimal(Number(body.products_price ?? 0) || 0),
        dateStart: parseDateOnly(body.date_start) ?? undefined,
        dateEnd: parseDateOnly(body.date_end) ?? undefined,
        dateCount: Number(body.date_count ?? 0) || 0,
        isActive: Boolean(body.is_active ?? true),
        updatedBy: userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        remark: true,
        price: true,
        dateStart: true,
        dateEnd: true,
        dateCount: true,
        isActive: true,
      },
    })

    return NextResponse.json({
      product: {
        id: product.id,
        products_name: product.name,
        products_desc: product.description ?? '',
        products_remark: product.remark ?? '',
        products_price: Number(product.price),
        date_start: product.dateStart.toISOString(),
        date_end: product.dateEnd.toISOString(),
        date_count: product.dateCount,
        is_active: product.isActive,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getAuthorizedUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = parseBody(await request.json())
    const id = String(body.id ?? '').trim()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await prisma.product.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedBy: userId,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
