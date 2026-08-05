import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { getCachedSession } from './auth';
import prisma from './prisma';
import { ROLE_GROUPS, hasAnyRole, normalizeRoles } from '@/lib/rbac/access'

export async function getSessionAndRoles() {
  const session = await getCachedSession();
  if (!session?.user?.email) return { session: null, roles: [] };
  const sessionRoles = normalizeRoles((session.user as any)?.roles)
  if (sessionRoles.length > 0) return { session, roles: sessionRoles };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { roles: { include: { role: true } } },
  });
  const roles = (user?.roles ?? []).map((ur: any) => ur.role.code);
  return { session, roles };
}

export async function getAuthorizedUserId() {
  return getAuthorizedUserIdByRoles(ROLE_GROUPS.ADMIN_STAFF)
}

export async function getAuthorizedUserIdByRoles(allowedRoles: readonly string[]) {
  const session = await getCachedSession()
  if (!session?.user?.email) return null

  const sessionUser = session.user as any
  const sessionRoles = normalizeRoles(sessionUser?.roles)
  if (sessionUser?.id && hasAnyRole(sessionRoles, allowedRoles)) return sessionUser.id

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, roles: { select: { role: { select: { code: true } } } } },
  })

  const roles = (user?.roles ?? []).map((entry) => entry.role.code)
  if (!user?.id || !hasAnyRole(roles, allowedRoles)) return null
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
