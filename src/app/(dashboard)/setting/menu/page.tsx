import prisma from '@/lib/prisma'
import MenuPageClient from './menu-client'

export default async function MenuPage() {
  const [menus, permissions] = await Promise.all([
    prisma.menu.findMany({
      where: { isDeleted: false },
      orderBy: [{ sequence: 'asc' }, { title: 'asc' }],
    }),
    prisma.permission.findMany({
      where: { isDeleted: false },
      orderBy: [{ createdAt: 'desc' }],
    }),
  ])

  return (
    <MenuPageClient
      initialMenus={menus.map((menu) => ({
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
      }))}
      initialMenuOptions={menus.map((menu) => ({ id: menu.id, label: `${menu.title} (${menu.key})` }))}
      initialPermissionOptions={permissions.map((permission) => ({ id: permission.id, label: `${permission.name ?? permission.code} (${permission.code})` }))}
    />
  )
}
