import { Car, ClipboardList, CreditCard, LayoutDashboard, Settings, Tag, Users } from 'lucide-react'
import type { MenuAccessItem } from '@/lib/rbac/access'

export type MenuItem = Pick<MenuAccessItem, 'title' | 'href' | 'iconKey'>

export const iconByKey = {
  dashboard: LayoutDashboard,
  car: Car,
  users: Users,
  tag: Tag,
  clipboard: ClipboardList,
  creditCard: CreditCard,
  settings: Settings,
} as const

export function toMenuItems(menus: MenuAccessItem[]): MenuItem[] {
  return menus.map((item) => ({
    title: item.title,
    href: item.href,
    iconKey: item.iconKey,
  }))
}
