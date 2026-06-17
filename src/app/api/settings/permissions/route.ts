import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthorizedUserId } from '../_utils'

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: Request) {
  const userId = await getAuthorizedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const permissionName = normalize(body.permission_name)
  const permissionCode = normalize(body.permission_code)
  if (!permissionName || !permissionCode) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  const permission = await prisma.permission.create({
    data: {
      name: permissionName,
      code: permissionCode,
      description: normalize(body.permission_desc) || null,
      remark: normalize(body.permission_remark) || null,
      createdBy: userId,
      updatedBy: userId,
    },
  })
  return NextResponse.json({
    permission: {
      id: permission.id,
      permission_name: permission.name ?? '',
      permission_code: permission.code,
      permission_desc: permission.description ?? '',
      permission_remark: permission.remark ?? '',
    },
  })
}

export async function PATCH(request: Request) {
  const userId = await getAuthorizedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const id = normalize(body.id)
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const permission = await prisma.permission.update({
    where: { id },
    data: {
      name: normalize(body.permission_name) || null,
      code: normalize(body.permission_code),
      description: normalize(body.permission_desc) || null,
      remark: normalize(body.permission_remark) || null,
      updatedBy: userId,
    },
  })
  return NextResponse.json({
    permission: {
      id: permission.id,
      permission_name: permission.name ?? '',
      permission_code: permission.code,
      permission_desc: permission.description ?? '',
      permission_remark: permission.remark ?? '',
    },
  })
}

export async function DELETE(request: Request) {
  const userId = await getAuthorizedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const id = normalize(body.id)
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  await prisma.permission.update({ where: { id }, data: { isDeleted: true, updatedBy: userId } })
  return NextResponse.json({ ok: true })
}
