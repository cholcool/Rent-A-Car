import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type MenuAccessItem = {
  title: string
  href: string
  iconKey: string
  sequence: number
  roles: string[]
}

export type MenuItem = Pick<MenuAccessItem, 'title' | 'href' | 'iconKey'>

export type MenuFormItem = {
  id: string
  key: string
  title: string
  icon: string
  path: string
  parentId: string | null
  sequence: number
  remark: string
  requiredPermission: string
  isActive: boolean
  isExternal: boolean
}

export const settingMenuPathPrefix = '/setting'

export function isSettingMenuPath(path: string) {
  return path === settingMenuPathPrefix || path.startsWith(`${settingMenuPathPrefix}/`)
}

export function getMenuIconComponent(iconName: string | null | undefined): LucideIcon {
  const key = iconName?.trim()
  if (!key) return LucideIcons.Settings
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[key]
  return Icon ?? LucideIcons.Settings
}

export function toMenuItems(menus: MenuAccessItem[]): MenuItem[] {
  return menus.map((item) => ({
    title: item.title,
    href: item.href,
    iconKey: item.iconKey,
  }))
}
