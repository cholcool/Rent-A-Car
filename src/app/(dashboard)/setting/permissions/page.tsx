import prisma from '@/lib/prisma'
import PermissionsPageClient, { type MenuRow, type PermissionRow } from './permissions-client'

export const dynamic = 'force-dynamic'

export default async function PermissionsPage() {
  const [permissions, menus] = await Promise.all([
    prisma.permission.findMany({ where: { isDeleted: false }, orderBy: { createdAt: 'desc' } }),
    prisma.menu.findMany({ where: { isDeleted: false }, orderBy: [{ sequence: 'asc' }, { title: 'asc' }] }),
  ])

  const permissionRows: PermissionRow[] = permissions.map((permission) => ({
    id: permission.id,
    permission_name: permission.name ?? '',
    permission_code: permission.code,
    permission_desc: permission.description ?? '',
    permission_remark: permission.remark ?? '',
  }))

  const menuRows: MenuRow[] = menus.map((menu) => ({
    id: menu.id,
    menu_key: menu.key,
    menu_title: menu.title,
  }))

  return <PermissionsPageClient initialPermissions={permissionRows} initialMenus={menuRows} />
}
