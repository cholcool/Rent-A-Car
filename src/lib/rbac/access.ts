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
const ACCESS_CACHE_TTL_MS = 60_000

type CacheEntry<T> = {
  expiresAt: number
  value: T
}

const roleCache = new Map<string, CacheEntry<string[]>>()
const menuCache = new Map<string, CacheEntry<MenuAccessItem[]>>()

function now() {
  return Date.now()
}

function logIfSlow(label: string, startedAt: number, thresholdMs = 25) {
  const duration = now() - startedAt
  if (process.env.NODE_ENV === 'development' && duration >= thresholdMs) {
    console.debug(`[auth/access] ${label} took ${duration}ms`)
  }
}

function getCacheValue<T>(cache: Map<string, CacheEntry<T>>, key: string) {
  const entry = cache.get(key)
  if (!entry) return null
  if (entry.expiresAt <= now()) {
    cache.delete(key)
    return null
  }
  return entry.value
}

function setCacheValue<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T) {
  cache.set(key, { expiresAt: now() + ACCESS_CACHE_TTL_MS, value })
}

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
  const normalizedEmail = userEmail.trim().toLowerCase()
  const cached = getCacheValue(roleCache, normalizedEmail)
  if (cached) return cached

  const startedAt = now()
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      roles: {
        where: { isDeleted: false },
        select: { role: { select: { code: true, isActive: true, isDeleted: true } } },
      },
    },
  })

  const roles = (user?.roles ?? [])
    .map((entry) => entry.role)
    .filter((role) => role.isActive && !role.isDeleted)
    .map((role) => role.code.toUpperCase())

  setCacheValue(roleCache, normalizedEmail, roles)
  logIfSlow('getDbRoleCodesForUser', startedAt)
  return roles
}

async function getDbAccessibleMenus(roleCodes: string[]) {
  const normalizedKey = [...roleCodes].map((role) => role.trim().toUpperCase()).sort().join('|')
  const cached = getCacheValue(menuCache, normalizedKey)
  if (cached) return cached

  const startedAt = now()
  const menus = await prisma.menu.findMany({
    where: { isDeleted: false, isActive: true },
    select: {
      title: true,
      path: true,
      icon: true,
      sequence: true,
      requiredPermission: true,
      roleMenuPermissions: {
        where: { isDeleted: false, role: { isDeleted: false, isActive: true } },
        select: {
          role: { select: { code: true } },
        },
      },
    },
    orderBy: [{ sequence: 'asc' }, { title: 'asc' }],
  })

  const mappedMenus = menus
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

  setCacheValue(menuCache, normalizedKey, mappedMenus)
  logIfSlow('getDbAccessibleMenus', startedAt)
  return mappedMenus
}

export async function getUserAccess(input?: {
  session?: AccessSessionUser | null
  userEmail?: string | null
  rawRoles?: unknown
}) {
  const startedAt = now()
  const sessionRoles = normalizeRoles(input?.rawRoles ?? input?.session?.roles)
  const roles = sessionRoles.length > 0 ? sessionRoles : await getDbRoleCodesForUser(input?.userEmail ?? input?.session?.email)
  const menus = await getDbAccessibleMenus(roles)
  logIfSlow('getUserAccess', startedAt, 10)
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
