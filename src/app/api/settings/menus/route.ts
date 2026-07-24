import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthorizedUserId } from '@/lib/auth-server'

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value === 'true'
  if (typeof value === 'number') return value === 1
  return fallback
}

function normalizeIcon(value: unknown) {
  return normalize(value) || 'Settings'
}

function toMenuRow(menu: {
  id: string
  key: string
  title: string
  icon: string | null
  path: string | null
  parentId: string | null
  sequence: number
  remark: string | null
  requiredPermission: string | null
  isActive: boolean
  isExternal: boolean
}) {
  return {
    id: menu.id,
    key: menu.key,
    title: menu.title,
    icon: menu.icon ?? 'Settings',
    path: menu.path ?? '',
    parentId: menu.parentId,
    sequence: menu.sequence,
    remark: menu.remark ?? '',
    requiredPermission: menu.requiredPermission ?? '',
    isActive: menu.isActive,
    isExternal: menu.isExternal,
  }
}

export async function GET() {
  const menus = await prisma.menu.findMany({
    where: { isDeleted: false },
    orderBy: [{ sequence: 'asc' }, { title: 'asc' }],
  })
  return NextResponse.json({
    menus: menus.map((menu) => toMenuRow(menu)),
  })
}

export async function POST(request: Request) {
  const userId = await getAuthorizedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const key = normalize(body.key)
  const title = normalize(body.title)
  const path = normalize(body.path)

  if (!key || !title || !path) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const menu = await prisma.menu.create({
    data: {
      key,
      title,
      icon: normalizeIcon(body.icon),
      path,
      parentId: normalize(body.parentId) || null,
      sequence: Number.isFinite(Number(body.sequence)) ? Number(body.sequence) : 0,
      remark: normalize(body.remark) || null,
      requiredPermission: normalize(body.requiredPermission) || null,
      isActive: normalizeBoolean(body.isActive, true),
      isExternal: normalizeBoolean(body.isExternal, false),
      createdBy: userId,
      updatedBy: userId,
    },
  })

  return NextResponse.json({ menu: toMenuRow(menu) })
}

export async function PATCH(request: Request) {
  const userId = await getAuthorizedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const id = normalize(body.id)
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const menu = await prisma.menu.update({
    where: { id },
    data: {
      key: normalize(body.key),
      title: normalize(body.title),
      icon: normalizeIcon(body.icon),
      path: normalize(body.path),
      parentId: normalize(body.parentId) || null,
      sequence: Number.isFinite(Number(body.sequence)) ? Number(body.sequence) : 0,
      remark: normalize(body.remark) || null,
      requiredPermission: normalize(body.requiredPermission) || null,
      isActive: normalizeBoolean(body.isActive, true),
      isExternal: normalizeBoolean(body.isExternal, false),
      updatedBy: userId,
    },
  })

  return NextResponse.json({ menu: toMenuRow(menu) })
}

export async function DELETE(request: Request) {
  const userId = await getAuthorizedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const id = normalize(body.id)
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  await prisma.menu.update({
    where: { id },
    data: { isDeleted: true, updatedBy: userId },
  })

  return NextResponse.json({ ok: true })
}
