'use server'

import prisma from '@/lib/prisma'
import { getSessionAndRoles } from '@/lib/auth-server'
import { CarStatus } from '@/lib/types'

interface CreateCarInput {
  vehicleTypeId: string
  brandId: string
  model: string
  year: string
  color: string
  license: string
  engine: string | null
  chassis: string | null
  mileage: number
  status: CarStatus
  remark: string | null
}

interface UpdateCarInput extends CreateCarInput {
  carId: string
}

export async function createCar(input: CreateCarInput) {
  try {
    // Check if license already exists
    const existingCar = await prisma.car.findUnique({
      where: { license: input.license.trim() },
    })

    if (existingCar) {
      return {
        success: false,
        error: 'ทะเบียนรถนี้ถูกใช้งานแล้ว กรุณาตรวจสอบอีกครั้ง',
      }
    }

    const userRoles = await getSessionAndRoles();
    const userId = userRoles.session?.user?.id

    if (!userId) {
      return {
        success: false,
        error: 'กรุณาเข้าสู่ระบบใหม่ก่อนสร้างข้อมูลรถ',
      }
    }

    // Create the car
    const car = await prisma.car.create({
      data: {
        vehicleTypeId: input.vehicleTypeId,
        brandId: input.brandId,
        model: input.model,
        year: input.year,
        color: input.color,
        license: input.license.trim(),
        engine: input.engine || null,
        chassis: input.chassis || null,
        mileage: input.mileage,
        status: input.status,
        remark: input.remark,
        isDeleted: false,
        createdAt: new Date(),
        createdBy: userId,
        updatedAt: new Date(),
        updatedBy: userId,
      },
      include: {
        brand: true,
        vehicleType: true,
      },
    })

    return {
      success: true,
      data: car,
    }
  } catch (error) {
    console.error('[createCar] Error:', error)
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการสร้างข้อมูลรถ',
    }
  }
}

export async function updateCar(input: UpdateCarInput) {
  try {
    const userRoles = await getSessionAndRoles()
    const userId = userRoles.session?.user?.id

    if (!userId) {
      return {
        success: false,
        error: 'กรุณาเข้าสู่ระบบใหม่ก่อนอัปเดตข้อมูลรถ',
      }
    }

    const existingCar = await prisma.car.findFirst({
      where: {
        id: input.carId,
        isDeleted: false,
      },
    })

    if (!existingCar) {
      return {
        success: false,
        error: 'ไม่พบข้อมูลรถที่ต้องการอัปเดต',
      }
    }

    const duplicateLicense = await prisma.car.findFirst({
      where: {
        license: input.license.trim(),
        isDeleted: false,
        NOT: { id: input.carId },
      },
    })

    if (duplicateLicense) {
      return {
        success: false,
        error: 'ทะเบียนรถนี้ถูกใช้งานแล้ว กรุณาตรวจสอบอีกครั้ง',
      }
    }

    const car = await prisma.car.update({
      where: { id: input.carId },
      data: {
        vehicleTypeId: input.vehicleTypeId,
        brandId: input.brandId,
        model: input.model,
        year: input.year,
        color: input.color,
        license: input.license.trim(),
        engine: input.engine || null,
        chassis: input.chassis|| null,
        mileage: Math.max(0, Math.floor(input.mileage)),
        status: input.status,
        remark: input.remark,
        updatedAt: new Date(),
        updatedBy: userId,
      },
      include: {
        brand: true,
        vehicleType: true,
      },
    })

    return {
      success: true,
      data: car,
    }
  } catch (error) {
    console.error('[updateCar] Error:', error)
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลรถ',
    }
  }
}
