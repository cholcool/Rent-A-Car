'use client'

import { useState } from 'react'
import type { ComponentType } from 'react'
import { BadgePlus, Car, Plus, Shapes, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import CarCreateDrawer from '@/components/CarCreateDrawer'
import BrandCreateDrawer from '@/components/BrandCreateDrawer'
import VehicleTypeCreateDrawer from '@/components/VehicleTypeCreateDrawer'
import MaintenanceCreateDrawer from '@/components/MaintenanceCreateDrawer'
import type { MaintenanceRow } from '@/lib/types'

interface VehicleType {
  id: string
  name: string
}

interface Brand {
  id: string
  name: string
}

interface CarOption {
  id: string
  label: string
}

interface CarSpeedDialProps {
  vehicleTypes: VehicleType[]
  brands: Brand[]
  cars: CarOption[]
}

type SpeedDialItem = {
  title: string
  description: string 
  key: string
  icon: ComponentType<{ className?: string }>
  action?: 'modal' | 'link'
}

const items: SpeedDialItem[] = [
  { 
    title: 'เพิ่มรถ', 
    description: '', 
    key: 'cars', 
    icon: Car,
  },
  {
    title: 'เพิ่มประเภทรถ',
    description: '',
    key: 'vehicle-types',
    icon: Shapes,
  },
  { 
    title: 'เพิ่มแบรนด์รถ', 
    description: '', 
    key: 'brands', 
    icon: BadgePlus,
  },
  {
    title: 'เพิ่มการบำรุงรักษา',
    description: '',
    key: 'maintenance',
    icon: Wrench,
  },
]

export default function CarSpeedDial({ vehicleTypes, brands, cars }: CarSpeedDialProps) {
  const [open, setOpen] = useState(false)
  const [showCarModal, setShowCarModal] = useState(false)
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const handleMenuClick = (item: SpeedDialItem) => {
    {
      if (item.key === 'cars') {
        setShowCarModal(true)
        setOpen(false)
      }
      if (item.key === 'vehicle-types') {
        setShowVehicleTypeModal(true)
        setOpen(false)
      }
      if (item.key === 'brands') {
        setShowBrandModal(true)
        setOpen(false)
      }
      if (item.key === 'maintenance') {
        setShowMaintenanceModal(true)
        setOpen(false)
      }
    }
  }

  return (
    <>
      {showCarModal && (
        <CarCreateDrawer 
          vehicleTypes={vehicleTypes}
          brands={brands}
          onClose={() => setShowCarModal(false)}
        />
      )}

      {showVehicleTypeModal && (
        <VehicleTypeCreateDrawer
          onClose={() => setShowVehicleTypeModal(false)}
        />
      )}

      {showBrandModal && (
        <BrandCreateDrawer onClose={() => setShowBrandModal(false)} />
      )}
      
      {showMaintenanceModal && (
        <MaintenanceCreateDrawer
          variant="modal"
          showList={false}
          carOptions={cars}
          maintenances={[] as MaintenanceRow[]}
          onClose={() => setShowMaintenanceModal(false)}
        />
      )}

      {open && (
        <button
          type="button"
          aria-label="Close speed dial"
          className="fixed inset-0 z-10 bg-transparent"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-6 right-6 z-10 flex flex-col items-end gap-3">
        {open && (
          <div className="flex flex-col items-end gap-3">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => (handleMenuClick(item))}
                  className={cn(
                    'group flex items-center gap-4 rounded-2xl border bg-white px-4 py-3 text-left shadow-lg shadow-slate-950/10 transition-all duration-200',
                    'min-w-47.5 max-w-55',
                    'border-slate-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/50'
                  )}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 shadow-sm transition group-hover:bg-white group-hover:text-violet-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-900">{item.title}</div>
                    <div className="truncate text-xs font-medium text-slate-500">{item.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {!showCarModal && 
        !showVehicleTypeModal && 
        !showBrandModal && 
        !showMaintenanceModal && 
        (
          <Button
            type="button"
            size="lg"
            onClick={() => setOpen((value) => !value)}
            className={cn(
              'h-14 w-14 rounded-xl border-2 border-violet-200 bg-violet-600 shadow-2xl shadow-violet-900/25',
              'hover:bg-violet-700'
            )}
          >
            <Plus className="h-7 w-7" aria-hidden="true" />
          </Button>
        )}
      </div>
    </>
  )
}
