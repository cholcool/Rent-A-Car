import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ROLE_GROUPS, hasAnyRole } from '@/lib/rbac/access'

export function userHasRole(userRoles: string[] | undefined, role: string) {
  if (!userRoles || userRoles.length === 0) return false
  return userRoles.includes(role)
}

export function userHasAnyRole(userRoles: string[] | undefined, allowed: string[]) {
  if (!userRoles || userRoles.length === 0) return false
  return allowed.some((r) => userRoles.includes(r))
}

export async function getAuthorizedUserId() {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, roles: { select: { role: { select: { code: true } } } } },
  })
  const roles = (user?.roles ?? []).map((entry) => entry.role.code)
  if (!user?.id || !hasAnyRole(roles, ROLE_GROUPS.ADMIN_STAFF)) return null
  return user.id
}

export function hashPassword(password: string) {
  const salt = randomBytes(8).toString('hex');
  const hash = scryptSync(password, salt, 32).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function isScryptHash(value: string | null | undefined) {
  if (!value) return false;
  const [algorithm, salt, hash] = value.split(':');
  return algorithm === 'scrypt' && Boolean(salt) && Boolean(hash);
}

export function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) return false;

  const [algorithm, salt, hash] = storedHash.split(':');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;

  const hashBuffer = Buffer.from(hash, 'hex');
  const candidateBuffer = scryptSync(password, salt, hashBuffer.length);
  return (
    hashBuffer.length === candidateBuffer.length && timingSafeEqual(hashBuffer, candidateBuffer)
  );
}
