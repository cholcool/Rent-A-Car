import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ROLE_GROUPS, hasAnyRole } from '@/lib/rbac/access'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

async function getAuthorizedUserId() {
  const session = await auth()
  if (!session?.user?.email) return null

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, roles: { select: { role: { select: { code: true } } } } },
  })
  const roles = (user?.roles ?? []).map((entry) => entry.role.code)
  if (!user?.id || !hasAnyRole(roles, ROLE_GROUPS.EDITORS)) return null
  return user.id
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
  return { filename, url: `/uploads/${filename}` }
}

export async function POST(request: Request) {
  const userId = await getAuthorizedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const carId = String(formData.get('carId') ?? '').trim()
  const files = formData.getAll('files').filter((value): value is File => value instanceof File && value.size > 0)
  if (!carId) return NextResponse.json({ error: 'carId is required' }, { status: 400 })
  if (files.length === 0) return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })

  const car = await prisma.car.findFirst({ where: { id: carId, isDeleted: false }, select: { id: true } })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const uploaded: Array<{ id: string; url: string; name: string }> = []
  for (const file of files) {
    const { filename, url } = await saveFile(file)
    const image = await prisma.image.create({
      data: {
        key: filename,
        url,
        name: file.name,
        size: BigInt(file.size),
        type: file.type || null,
        createdBy: userId,
        updatedBy: userId,
      },
      select: { id: true, url: true, name: true },
    })

    await prisma.mapCarImage.create({
      data: {
        carId,
        imageId: image.id,
        createdBy: userId,
        updatedBy: userId,
      },
    })

    uploaded.push(image)
  }

  return NextResponse.json({ images: uploaded })
}

export async function DELETE(request: Request) {
  const userId = await getAuthorizedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const imageId = String(body.imageId ?? '').trim()
  if (!imageId) return NextResponse.json({ error: 'imageId is required' }, { status: 400 })

  const image = await prisma.image.findFirst({
    where: { id: imageId, isDeleted: false },
    select: { id: true, key: true, url: true, name: true },
  })
  if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

  await prisma.mapCarImage.updateMany({
    where: { imageId },
    data: { isDeleted: true, updatedBy: userId },
  })
  await prisma.image.update({
    where: { id: imageId },
    data: { isDeleted: true, updatedBy: userId },
  })

  // Note: function นี้จะลบไฟล์รูปภาพออกจากระบบไฟล์
  // await unlink(join(UPLOAD_DIR, image.key)).catch(() => undefined)

  return NextResponse.json({ ok: true })
}
