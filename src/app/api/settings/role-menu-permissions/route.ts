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
  const roleId = normalize(body.role_id)
  const menuId = normalize(body.menu_id)
  const permissionId = normalize(body.permission_id)
  if (!roleId || !menuId || !permissionId) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const mapping = await prisma.roleMenuPermission.create({
    data: {
      roleId,
      menuId,
      permissionId,
      createdBy: userId,
    },
  })

  return NextResponse.json({ mapping })
}

export async function DELETE(request: Request) {
  const userId = await getAuthorizedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const id = normalize(body.id)
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  await prisma.roleMenuPermission.update({ where: { id }, data: { isDeleted: true, createdBy: userId } })
  return NextResponse.json({ ok: true })
}
