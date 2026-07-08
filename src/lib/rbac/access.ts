export type AuthFailureReason = 'missing-session' | 'token-expired' | 'role-denied' | 'no-access'

export type RouteAccess = {
  prefix: string
  roles?: string[]
}

export type MenuAccess = {
  title: string
  href: string
  iconKey: 'dashboard' | 'car' | 'users' | 'tag' | 'clipboard' | 'creditCard' | 'settings'
  roles?: string[]
}

export const appAccessMap: MenuAccess[] = [
  { title: 'Dashboard', href: '/dashboard', iconKey: 'dashboard', roles: ['admin', 'manager'] },
  { title: 'จัดการรถ', href: '/cars', iconKey: 'car', roles: ['admin', 'manager', 'agent', 'user'] },
  { title: 'ข้อมูลลูกค้า', href: '/driver', iconKey: 'users', roles: ['admin', 'manager', 'agent', 'user'] },
  { title: 'ข้อมูลบริการ', href: '/products', iconKey: 'tag', roles: ['admin', 'manager', 'agent', 'user'] },
  { title: 'บันทึกรายการ', href: '/bookings', iconKey: 'clipboard', roles: ['admin', 'manager', 'agent', 'user'] },
  { title: 'การชำระเงิน', href: '/payments', iconKey: 'creditCard', roles: [''] },
  { title: 'ตั้งค่าระบบ', href: '/setting/users', iconKey: 'settings', roles: ['admin', 'manager'] },
  { title: 'ตั้งค่าระบบ', href: '/setting/roles', iconKey: 'settings', roles: [''] },
  { title: 'ตั้งค่าระบบ', href: '/setting/permissions', iconKey: 'settings', roles: [''] },
]

export const routeAccessMap: RouteAccess[] = appAccessMap.map(({ href, roles }) => ({
  prefix: href,
  roles,
}))

function normalizeRoles(rawRoles: unknown): string[] {
  if (!rawRoles) return []
  if (Array.isArray(rawRoles)) return rawRoles.map((role) => String(role).toLowerCase())
  if (typeof rawRoles === 'string') return rawRoles.split(',').map((role) => role.trim().toLowerCase()).filter(Boolean)
  return []
}

function isExpired(token: { exp?: number } | null | undefined) {
  if (!token?.exp) return false
  return Date.now() >= token.exp * 1000
}

export function getRouteAccess(pathname: string) {
  return routeAccessMap.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`))
}

export function getMenuAccessForRoles(rawRoles: unknown) {
  const roles = normalizeRoles(rawRoles)
  return appAccessMap.filter((item) => !item.roles?.length || item.roles.some((role) => roles.includes(role.toLowerCase())))
}

export function canAccessPath(pathname: string, rawRoles: unknown) {
  const access = getRouteAccess(pathname)
  const roles = normalizeRoles(rawRoles)

  if (!access) return { allowed: true, roles, access: null }
  if (!access.roles?.length) return { allowed: true, roles, access }

  const allowed = access.roles.some((role) => roles.includes(role.toLowerCase()))
  return { allowed, roles, access }
}

export function getAuthFailureReason(pathname: string, token: { exp?: number } | null | undefined, rawRoles: unknown) {
  if (!token) return 'missing-session'
  if (isExpired(token)) return 'token-expired'

  const { allowed, access } = canAccessPath(pathname, rawRoles)
  if (!access) return null
  if (!allowed) return 'role-denied'

  return null
}
