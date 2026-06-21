'use server'

import prisma from '@/lib/prisma'
import { getSessionAndRoles } from '@/lib/auth-server'
import { MaintenanceStatus, MaintenanceType } from '@/lib/types'

interface MaintenanceInput {
  carId: string
  maintenanceId?: string
  type: MaintenanceType
  name: string
  description: string | null
  remark: string | null
  status: MaintenanceStatus
  mileage: number
  mileageTarget: number
  mileageAlert: number
  dateAlert: string | null
  dateStart: string
  dateEnd: string
  dateCount: number
}

export async function createMaintenance(input: MaintenanceInput) {
  try {
    const userRoles = await getSessionAndRoles()
    const userId = userRoles.session?.user?.id

    if (!userId) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบใหม่ก่อนสร้างข้อมูลการบำรุงรักษา' }
    }

    const maintenance = await prisma.maintenance.create({
      data: {
        carId: input.carId,
        type: input.type,
        name: input.name.trim(),
        description: input.description,
        remark: input.remark,
        status: input.status,
        mileage: Math.max(0, Math.floor(input.mileage || 0)),
        mileageTarget: Math.max(0, Math.floor(input.mileageTarget || 0)),
        mileageAlert: Math.max(0, Math.floor(input.mileageAlert || 0)),
        dateAlert: input.dateAlert ? new Date(input.dateAlert) : null,
        dateStart: new Date(input.dateStart),
        dateEnd: new Date(input.dateEnd),
        dateCount: Math.max(0, Math.floor(input.dateCount || 0)),
        isDeleted: false,
        createdAt: new Date(),
        createdBy: userId,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    })

    await prisma.car.update({
      where: { id: input.carId },
      data: {
        mileage: Math.max(0, Math.floor(input.mileage || 0)),
        updatedAt: new Date(),
        updatedBy: userId,
      },
    })

    return { success: true, data: maintenance }
  } catch (error) {
    console.error('[createMaintenance] Error:', error)
    return { success: false, error: 'เกิดข้อผิดพลาดในการสร้างการบำรุงรักษา' }
  }
}

export async function updateMaintenance(input: MaintenanceInput) {
  try {
    const userRoles = await getSessionAndRoles()
    const userId = userRoles.session?.user?.id
    if (!userId || !input.maintenanceId) {
      return { success: false, error: 'ไม่สามารถอัปเดตข้อมูลได้' }
    }

    const maintenance = await prisma.maintenance.update({
      where: { id: input.maintenanceId },
      data: {
        type: input.type,
        name: input.name.trim(),
        description: input.description,
        remark: input.remark,
        status: input.status,
        mileage: Math.max(0, Math.floor(input.mileage || 0)),
        mileageTarget: Math.max(0, Math.floor(input.mileageTarget || 0)),
        mileageAlert: Math.max(0, Math.floor(input.mileageAlert || 0)),
        dateAlert: input.dateAlert ? new Date(input.dateAlert) : null,
        dateStart: new Date(input.dateStart),
        dateEnd: new Date(input.dateEnd),
        dateCount: Math.max(0, Math.floor(input.dateCount || 0)),
        updatedAt: new Date(),
        updatedBy: userId,
      },
    })

    await prisma.car.update({
      where: { id: input.carId },
      data: {
        mileage: Math.max(0, Math.floor(input.mileage || 0)),
        updatedAt: new Date(),
        updatedBy: userId,
      },
    })

    return { success: true, data: maintenance }
  } catch (error) {
    console.error('[updateMaintenance] Error:', error)
    return { success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตการบำรุงรักษา' }
  }
}

export async function deleteMaintenance(maintenanceId: string) {
  try {
    const userRoles = await getSessionAndRoles()
    const userId = userRoles.session?.user?.id
    if (!userId) return { success: false, error: 'กรุณาเข้าสู่ระบบใหม่ก่อนลบข้อมูล' }

    await prisma.maintenance.update({
      where: { id: maintenanceId },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('[deleteMaintenance] Error:', error)
    return { success: false, error: 'เกิดข้อผิดพลาดในการลบการบำรุงรักษา' }
  }
}
