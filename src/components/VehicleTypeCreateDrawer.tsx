'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import VehicleTypeForm from '@/components/VehicleTypeForm'

interface VehicleTypeCreateModalProps {
  onClose: () => void
}

export default function VehicleTypeCreateModal({ onClose }: VehicleTypeCreateModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[2px] my-0"
        onClick={onClose}
      />
      
      <aside className="fixed right-0 top-0 z-40 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <Card className="h-full rounded-none border-0">
          <CardContent className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-950">เพิ่มประเภทรถ</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  เพิ่มประเภทรถใหม่เข้าไปในระบบ
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex-1 overflow-y-auto">
              <VehicleTypeForm onSuccess={onClose} />
            </div>
          </CardContent>
        </Card>
      </aside>
    </>
  )
}