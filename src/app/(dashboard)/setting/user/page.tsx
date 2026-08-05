import prisma from '@/lib/prisma'
import UsersPageClient, { type RoleRow, type UserRow } from './users-client'

export default async function UsersPage() {
  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        cardImage: true,
        roles: {
          where: { isDeleted: false },
          include: { role: true },
        },
      },
    }),
    prisma.role.findMany({
      where: { isDeleted: false, code: {not: "ADMIN"} },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const userRows: UserRow[] = users.map((user) => ({
    id: user.id,
    user_name: user.userName,
    user_email: user.email,
    user_first_name: user.firstName,
    user_last_name: user.lastName,
    user_phone: user.phone,
    user_card_no: user.cardNo,
    user_card_image_id: user.cardImageId ?? null,
    user_card_image: user.cardImage
      ? {
          id: user.cardImage.id,
          key: user.cardImage.key,
          url: user.cardImage.url,
          name: user.cardImage.name,
          size: user.cardImage.size ? Number(user.cardImage.size) : undefined,
          type: user.cardImage.type ?? undefined,
          remark: user.cardImage.remark ?? undefined,
        }
      : null,
    user_address: user.address,
    user_remark: user.remark ?? '',
    role_ids: user.roles.map((item) => item.role.id),
    role_names: user.roles.map((item) => item.role.code),
  }))

  const roleRows: RoleRow[] = roles.map((role) => ({
    id: role.id,
    role_name: role.name,
    role_code: role.code,
    role_desc: role.description ?? '',
    role_remark: role.remark ?? '',
    is_active: role.isActive,
  }))

  return <UsersPageClient initialUsers={userRows} initialRoles={roleRows} />
}
