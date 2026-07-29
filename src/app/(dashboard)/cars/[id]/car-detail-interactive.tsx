'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui'
import { MaintenanceRow } from '@/lib/types'

const CarImageUploader = dynamic(() => import('@/components/CarImageUploader'), {
  ssr: false,
  loading: () => (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="p-6">
        <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
      </CardContent>
    </Card>
  ),
})

const MaintenanceCreateDrawer = dynamic(() => import('@/components/MaintenanceCreateDrawer'), {
  ssr: false,
  loading: () => (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="p-6">
        <div className="h-96 animate-pulse rounded-xl bg-slate-100" />
      </CardContent>
    </Card>
  ),
})

type Props = {
  carId: string
  carMileage: number
  images: Array<{ id: string; url: string; name?: string | null; alt?: string }>
  maintenances: MaintenanceRow[]
  carOptions?: never
}

export default function CarDetailInteractive({ carId, carMileage, images, maintenances }: Props) {
  return (
    <div className="space-y-6 overflow-auto">
      <CarImageUploader carId={carId} initialImages={images} />
      <MaintenanceCreateDrawer carId={carId} carMileage={carMileage} maintenances={maintenances} />
    </div>
  )
}
