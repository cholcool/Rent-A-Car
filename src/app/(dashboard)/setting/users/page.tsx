import prisma from '@/lib/prisma'
import UsersPageClient, { type PermissionRow, type RoleRow, type UserRow } from './users-client'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const [users, roles, permissions] = await Promise.all([
    prisma.user.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        roles: {
          where: { isDeleted: false },
          include: { role: true },
        },
      },
    }),
    prisma.role.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.permission.findMany({
      where: { isDeleted: false },
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

  const permissionRows: PermissionRow[] = permissions.map((permission) => ({
    id: permission.id,
    permission_name: permission.name ?? '',
    permission_code: permission.code,
    permission_desc: permission.description ?? '',
    permission_remark: permission.remark ?? '',
  }))

  return <UsersPageClient initialUsers={userRows} initialRoles={roleRows} initialPermissions={permissionRows} />
}
