import prisma from '@/lib/prisma'
import DriverPageClient from './driver-client'
import { DriverRow } from '@/lib/types' 

export const dynamic = 'force-dynamic'

export default async function DriverPage() {
  const drivers = await prisma.driver.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: 'desc' },
    include: {
      cardImage: true,
      licenseImage: true,
    },
  })

  const rows: DriverRow[] = drivers.map((driver) => ({
    id: driver.id,
    fullName: driver.fullName,
    phone: driver.phone,
    remark: driver.remark ?? '',
    cardImageId: driver.cardImageId ?? '',
    licenseImageId: driver.licenseImageId ?? '',
    cardImage: driver.cardImage
      ? {
          id: driver.cardImage.id,
          url: driver.cardImage.url,
          name: driver.cardImage.name,
        }
      : null,
    licenseImage: driver.licenseImage
      ? {
          id: driver.licenseImage.id,
          url: driver.licenseImage.url,
          name: driver.licenseImage.name,
        }
      : null,
  }))

  return <DriverPageClient initialDrivers={rows} />
}
