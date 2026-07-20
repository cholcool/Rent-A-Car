import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import prisma from '@/lib/prisma'
import { ROLE_GROUPS } from '@/lib/rbac/access'
import { getAuthorizedUserIdByRoles } from '@/lib/auth-server'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

async function getUserId() {
  return getAuthorizedUserIdByRoles(ROLE_GROUPS.EDITORS)
}

async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true })
}

async function saveFile(file: File) {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.includes('.') ? file.name.split('.').pop() : ''
  const filename = `${randomUUID()}${ext ? `.${ext.toLowerCase()}` : ''}`
  await ensureUploadDir()
  await writeFile(join(UPLOAD_DIR, filename), buffer)
  return { key: filename, url: `/uploads/${filename}` }
}

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  const saved = await saveFile(file)
  const name = file.name

  const image = await prisma.image.create({
    data: {
      key: saved.key,
      url: saved.url,
      name,
      size: BigInt(file.size),
      type: file.type || null,
      createdBy: userId,
      updatedBy: userId,
    },
    select: { id: true, key: true, url: true, name: true },
  })

  return NextResponse.json({ image })
}
