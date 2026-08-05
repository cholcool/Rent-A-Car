import prisma from '@/lib/prisma'
import { resolveMaintenanceStatus } from '@/lib/maintenance-status'

export async function syncMaintenanceStatuses(carId?: string) {
  const maintenances = await prisma.maintenance.findMany({
    where: {
      isDeleted: false,
      ...(carId ? { carId } : {}),
    },
    include: {
      car: {
        select: { mileage: true },
      },
    },
  })

  await Promise.all(
    maintenances.map((maintenance) => {
      const nextStatus = resolveMaintenanceStatus({
        status: maintenance.status,
        dateStart: maintenance.dateStart,
        dateEnd: maintenance.dateEnd,
        mileage: maintenance.mileage,
        mileageAlert: maintenance.mileageAlert,
        mileageTarget: maintenance.mileageTarget,
        currentMileage: maintenance.car.mileage,
      })

      if (nextStatus === maintenance.status) return Promise.resolve()

      return prisma.maintenance.update({
        where: { id: maintenance.id },
        data: {
          status: nextStatus,
          updatedAt: new Date(),
        },
      })
    })
  )
}
