import { scryptSync, randomBytes } from 'node:crypto'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function getAuthorizedUserId() {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, roles: { select: { role: { select: { code: true } } } } },
  })
  const roles = (user?.roles ?? []).map((entry) => entry.role.code)
  if (!user?.id || !roles.some((role) => ['ADMIN', 'MANAGER'].includes(role))) return null
  return user.id
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}
