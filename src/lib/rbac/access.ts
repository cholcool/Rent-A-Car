import prisma from '@/lib/prisma'

export type AuthFailureReason = 'missing-session' | 'token-expired' | 'role-denied' | 'no-access'

export type AccessSessionUser = {
  id?: string | null
  email?: string | null
  name?: string | null
  roles?: string[] | string | null
}

export type MenuAccessItem = {
  title: string
  href: string
  iconKey: 'dashboard' | 'car' | 'users' | 'tag' | 'clipboard' | 'creditCard' | 'settings'
  sequence: number
  roles: string[]
}

const MENU_ICON_KEYS = ['dashboard', 'car', 'users', 'tag', 'clipboard', 'creditCard', 'settings'] as const

function normalizeIconKey(value: string | null | undefined): MenuAccessItem['iconKey'] {
  return MENU_ICON_KEYS.includes(value as MenuAccessItem['iconKey']) ? (value as MenuAccessItem['iconKey']) : 'settings'
}

export const ROLE_GROUPS = {
  ADMIN_STAFF: ['ADMIN', 'MANAGER'] as const,
  EDITORS: ['ADMIN', 'MANAGER', 'AGENT'] as const,
  VIEW_ALL: ['ADMIN', 'MANAGER', 'AGENT', 'VIEWER'] as const,
} as const

export function hasAnyRole(userRoles: string[] | undefined, allowed: readonly string[]) {
  if (!userRoles || userRoles.length === 0) return false
  return allowed.some((role) => userRoles.includes(role))
}

export function normalizeRoles(rawRoles: unknown): string[] {
  if (!rawRoles) return []
  if (Array.isArray(rawRoles)) return rawRoles.map((role) => String(role).trim().toUpperCase()).filter(Boolean)
  if (typeof rawRoles === 'string') return rawRoles.split(',').map((role) => role.trim().toUpperCase()).filter(Boolean)
  return []
}

export function isExpired(token: { exp?: number } | null | undefined) {
  if (!token?.exp) return false
  return Date.now() >= token.exp * 1000
}

async function getDbRoleCodesForUser(userEmail?: string | null) {
  if (!userEmail) return []
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      roles: {
        where: { isDeleted: false },
        select: { role: { select: { code: true, isActive: true, isDeleted: true } } },
      },
    },
  })

  return (user?.roles ?? [])
    .map((entry) => entry.role)
    .filter((role) => role.isActive && !role.isDeleted)
    .map((role) => role.code.toUpperCase())
}

async function getDbAccessibleMenus(roleCodes: string[]) {
  const menus = await prisma.menu.findMany({
    where: { isDeleted: false, isActive: true },
    include: {
      roleMenuPermissions: {
        where: { isDeleted: false, role: { isDeleted: false, isActive: true } },
        include: {
          role: { select: { code: true } },
          permission: { select: { code: true } },
        },
      },
    },
    orderBy: [{ sequence: 'asc' }, { title: 'asc' }],
  })

  return menus
    .map((menu) => {
      const mappedRoles = menu.roleMenuPermissions.map((mapping) => mapping.role.code.toUpperCase())
      const fallbackRoles = menu.requiredPermission
        ? menu.requiredPermission.split(',').map((role) => role.trim().toUpperCase()).filter(Boolean)
        : []
      const roles = mappedRoles.length > 0 ? mappedRoles : fallbackRoles
      return {
        title: menu.title,
        href: menu.path ?? '',
        iconKey: normalizeIconKey(menu.icon),
        sequence: menu.sequence,
        roles,
      } satisfies MenuAccessItem
    })
    .filter((menu) => menu.href && (!menu.roles.length || menu.roles.some((role) => roleCodes.includes(role))))
}

export async function getUserAccess(input?: {
  session?: AccessSessionUser | null
  userEmail?: string | null
  rawRoles?: unknown
}) {
  const sessionRoles = normalizeRoles(input?.rawRoles ?? input?.session?.roles)
  const dbRoles = await getDbRoleCodesForUser(input?.userEmail ?? input?.session?.email)
  const roles = dbRoles.length > 0 ? dbRoles : sessionRoles
  const menus = await getDbAccessibleMenus(roles)
  return { roles, menus }
}

export async function getDefaultLandingPath(input?: {
  session?: AccessSessionUser | null
  userEmail?: string | null
  rawRoles?: unknown
}) {
  const { menus } = await getUserAccess(input)
  return menus[0]?.href ?? '/signin'
}

export async function canAccessPath(
  pathname: string,
  input?: { session?: AccessSessionUser | null; userEmail?: string | null; rawRoles?: unknown }
) {
  const { roles, menus } = await getUserAccess(input)
  const access = menus.find((menu) => pathname === menu.href || pathname.startsWith(`${menu.href}/`))
  if (!access) return { allowed: false, roles, access: null }
  if (!access.roles.length) return { allowed: true, roles, access }
  const allowed = access.roles.some((role) => roles.includes(role))
  return { allowed, roles, access }
}

export async function getAuthFailureReason(
  pathname: string,
  token: { exp?: number; email?: string | null } | null | undefined,
  rawRoles: unknown
) {
  if (!token) return 'missing-session'
  if (isExpired(token)) return 'token-expired'
  const { allowed, access } = await canAccessPath(pathname, { userEmail: token.email ?? null, rawRoles })
  if (!access) return 'no-access'
  if (!allowed) return 'role-denied'
  return null
}
