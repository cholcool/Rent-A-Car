import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

type OwnerType = 'driver' | 'guarantor'
type UploadField = 'card' | 'license'

async function getUserId() {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, roles: { select: { role: { select: { code: true } } } } },
  })
  const roles = (user?.roles ?? []).map((entry) => entry.role.code)
  if (!user?.id || !roles.some((role) => ['ADMIN', 'MANAGER', 'AGENT'].includes(role))) return null
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
  return { key: filename, url: `/uploads/${filename}` }
}

function validateField(field: string): field is UploadField {
  return ['card', 'license'].includes(field)
}

async function resolveOwnerOrThrow(ownerType: OwnerType, ownerId: string) {
  const driver = await prisma.driver.findFirst({
    where: { id: ownerId, isDeleted: false },
    select: { id: true },
  })
  if (!driver) return null

  if (ownerType === 'driver') return { driverId: ownerId }

  const guarantor = await prisma.guarantor.findFirst({
    where: { driverId: ownerId },
    select: { id: true },
  })
  if (!guarantor) return null

  return { driverId: ownerId }
}

async function uploadImage(ownerType: OwnerType, request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const ownerId = String(formData.get('ownerId') ?? '').trim()
  const field = String(formData.get('field') ?? '').trim()
  const file = formData.get('file')

  if (!ownerId) return NextResponse.json({ error: 'ownerId is required' }, { status: 400 })
  if (!validateField(field)) return NextResponse.json({ error: 'field is invalid' }, { status: 400 })
  if (!(file instanceof File) || file.size <= 0) return NextResponse.json({ error: 'file is required' }, { status: 400 })

  const owner = await resolveOwnerOrThrow(ownerType, ownerId)
  if (!owner) {
    return NextResponse.json(
      { error: ownerType === 'driver' ? 'Driver not found' : 'Guarantor not found' },
      { status: 404 }
    )
  }

  const saved = await saveFile(file)
  const image = await prisma.image.create({
    data: {
      key: saved.key,
      url: saved.url,
      name: file.name,
      size: BigInt(file.size),
      type: file.type || null,
      createdBy: userId,
      updatedBy: userId,
    },
    select: { id: true, key: true, url: true, name: true },
  })

  if (ownerType === 'driver') {
    await prisma.driver.update({
      where: { id: owner.driverId },
      data: {
        ...(field === 'card' ? { cardImageId: image.id } : { licenseImageId: image.id }),
        updatedBy: userId,
      },
    })
  } else {
    await prisma.guarantor.update({
      where: { driverId: owner.driverId },
      data: {
        ...(field === 'card' ? { cardImageId: image.id } : { licenseImageId: image.id }),
        updatedBy: userId,
      },
    })
  }

  return NextResponse.json({ image, field })
}

async function deleteImage(ownerType: OwnerType, request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const ownerId = String(body.ownerId ?? '').trim()
  const field = String(body.field ?? '').trim()
  const imageId = String(body.imageId ?? '').trim()

  if (!ownerId) return NextResponse.json({ error: 'ownerId is required' }, { status: 400 })
  if (!validateField(field)) return NextResponse.json({ error: 'field is invalid' }, { status: 400 })
  if (!imageId) return NextResponse.json({ error: 'imageId is required' }, { status: 400 })

  const image = await prisma.image.findFirst({
    where: { id: imageId, isDeleted: false },
    select: { id: true, key: true, url: true, name: true },
  })
  if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

  const owner = await resolveOwnerOrThrow(ownerType, ownerId)
  if (!owner) {
    return NextResponse.json(
      { error: ownerType === 'driver' ? 'Driver not found' : 'Guarantor not found' },
      { status: 404 }
    )
  }

  if (ownerType === 'driver') {
    await prisma.driver.update({
      where: { id: owner.driverId },
      data: {
        ...(field === 'card' ? { cardImageId: null } : { licenseImageId: null }),
        updatedBy: userId,
      },
    })
  } else {
    await prisma.guarantor.update({
      where: { driverId: owner.driverId },
      data: {
        ...(field === 'card' ? { cardImageId: null } : { licenseImageId: null }),
        updatedBy: userId,
      },
    })
  }

  await prisma.image.update({
    where: { id: imageId },
    data: { isDeleted: true, updatedBy: userId },
  })

  return NextResponse.json({ ok: true })
}

export const createDriverImagePostRoute = () => (request: Request) => uploadImage('driver', request)
export const createDriverImageDeleteRoute = () => (request: Request) => deleteImage('driver', request)
export const createGuarantorImagePostRoute = () => (request: Request) => uploadImage('guarantor', request)
export const createGuarantorImageDeleteRoute = () => (request: Request) => deleteImage('guarantor', request)
