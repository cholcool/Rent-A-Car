import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthorizedUserId } from '@/lib/auth-server'

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: Request) {
  const userId = await getAuthorizedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const roleName = normalize(body.role_name)
  const roleCode = normalize(body.role_code)
  if (!roleName || !roleCode) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  const role = await prisma.role.create({
    data: {
      name: roleName,
      code: roleCode,
      description: normalize(body.role_desc) || null,
      remark: normalize(body.role_remark) || null,
      isActive: body.is_active !== false,
      createdBy: userId,
      updatedBy: userId,
    },
  })
  return NextResponse.json({
    role: {
      id: role.id,
      role_name: role.name,
      role_code: role.code,
      role_desc: role.description ?? '',
      role_remark: role.remark ?? '',
      is_active: role.isActive,
    },
  })
}

export async function PATCH(request: Request) {
  const userId = await getAuthorizedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const id = normalize(body.id)
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const role = await prisma.role.update({
    where: { id },
    data: {
      name: normalize(body.role_name),
      code: normalize(body.role_code),
      description: normalize(body.role_desc) || null,
      remark: normalize(body.role_remark) || null,
      isActive: body.is_active !== false,
      updatedBy: userId,
    },
  })
  return NextResponse.json({
    role: {
      id: role.id,
      role_name: role.name,
      role_code: role.code,
      role_desc: role.description ?? '',
      role_remark: role.remark ?? '',
      is_active: role.isActive,
    },
  })
}

export async function DELETE(request: Request) {
  const userId = await getAuthorizedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const id = normalize(body.id)
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  await prisma.role.update({ where: { id }, data: { isDeleted: true, updatedBy: userId } })
  return NextResponse.json({ ok: true })
}
