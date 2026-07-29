import prisma from '@/lib/prisma'
import RolesPageClient, { type RoleRow } from './roles-client'

export default async function RolesPage() {
  const roles = await prisma.role.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: 'desc' },
  })

  const rows: RoleRow[] = roles.map((role) => ({
    id: role.id,
    role_name: role.name,
    role_code: role.code,
    role_desc: role.description ?? '',
    role_remark: role.remark ?? '',
    is_active: role.isActive,
  }))

  return <RolesPageClient initialRoles={rows} />
}
