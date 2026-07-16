import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ROLE_GROUPS } from '@/lib/rbac/access'
import { getAuthorizedUserIdByRoles } from '@/lib/auth-server'

async function getUserId() {
  return getAuthorizedUserIdByRoles(ROLE_GROUPS.EDITORS)
}

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const key = String(body.key ?? '').trim()
  const url = String(body.url ?? '').trim()
  const name = String(body.name ?? '').trim()
  const size = body.size === undefined || body.size === null ? null : BigInt(Math.max(Number(body.size) || 0, 0))
  const type = String(body.type ?? '').trim() || null

  if (!key || !url || !name) return NextResponse.json({ error: 'Missing image data' }, { status: 400 })

  const image = await prisma.image.create({
    data: {
      key,
      url,
      name,
      size,
      type,
      createdBy: userId,
      updatedBy: userId,
    },
    select: { id: true, key: true, url: true, name: true },
  })

  return NextResponse.json({ image })
}
