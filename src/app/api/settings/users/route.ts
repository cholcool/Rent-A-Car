import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthorizedUserId, hashPassword } from '../_utils'

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: Request) {
  const userId = await getAuthorizedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const userName = normalize(body.user_name)
  const email = normalize(body.user_email)
  const password = normalize(body.user_password)
  const firstName = normalize(body.user_first_name)
  const lastName = normalize(body.user_last_name)
  const phone = normalize(body.user_phone)
  const remark = normalize(body.user_remark)
  const roleIds = Array.isArray(body.role_ids) ? body.role_ids.map((roleId: unknown) => String(roleId)).filter(Boolean) : []
  if (!userName || !email || !password || !firstName || !lastName || !phone) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const user = await prisma.user.create({
    data: {
      userName,
      email,
      hashedPassword: hashPassword(password),
      firstName,
      lastName,
      phone,
      remark: remark || null,
      createdBy: userId,
      updatedBy: userId,
      roles: roleIds.length
        ? {
            createMany: {
              data: roleIds.map((roleId: string) => ({ roleId, createdBy: userId })),
            },
          }
        : undefined,
    },
    include: { roles: { where: { isDeleted: false }, include: { role: true } } },
  })

  return NextResponse.json({
    user: {
      id: user.id,
      user_name: user.userName,
      user_email: user.email,
      user_first_name: user.firstName,
      user_last_name: user.lastName,
      user_phone: user.phone,
      user_remark: user.remark ?? '',
      role_ids: user.roles.map((entry) => entry.roleId),
      role_names: user.roles.map((entry) => entry.role.code),
    },
  })
}

export async function PATCH(request: Request) {
  const userId = await getAuthorizedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const id = normalize(body.id)
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const roleIds = Array.isArray(body.role_ids) ? body.role_ids.map((roleId: unknown) => String(roleId)).filter(Boolean) : []
  const updateData: Record<string, unknown> = {
    userName: normalize(body.user_name),
    email: normalize(body.user_email),
    firstName: normalize(body.user_first_name),
    lastName: normalize(body.user_last_name),
    phone: normalize(body.user_phone),
    remark: normalize(body.user_remark) || null,
    updatedBy: userId,
  }
  if (normalize(body.user_password)) updateData.hashedPassword = hashPassword(normalize(body.user_password))

  await prisma.$transaction(async (tx) => {
    await tx.userRole.updateMany({ where: { userId: id }, data: { isDeleted: true } })
    await tx.user.update({
      where: { id },
      data: updateData,
    })
    if (roleIds.length > 0) {
      await tx.userRole.createMany({
        data: roleIds.map((roleId: string) => ({ userId: id, roleId, createdBy: userId })),
      })
    }
  })

  const user = await prisma.user.findUnique({
    where: { id },
    include: { roles: { where: { isDeleted: false }, include: { role: true } } },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({
    user: {
      id: user.id,
      user_name: user.userName,
      user_email: user.email,
      user_first_name: user.firstName,
      user_last_name: user.lastName,
      user_phone: user.phone,
      user_remark: user.remark ?? '',
      role_ids: user.roles.map((entry) => entry.roleId),
      role_names: user.roles.map((entry) => entry.role.code),
    },
  })
}

export async function DELETE(request: Request) {
  const userId = await getAuthorizedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const id = normalize(body.id)
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  await prisma.user.update({ where: { id }, data: { isDeleted: true, updatedBy: userId } })
  return NextResponse.json({ ok: true })
}
