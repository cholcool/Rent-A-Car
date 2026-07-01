'use client'

import { Card, CardContent } from '@/components/ui'
import { X } from 'lucide-react'

interface Props {
  reportField: any[] | null
  setDrawerOpen?: (open: boolean) => void
}

export default function ReportFieldDrawer({
  reportField,
  setDrawerOpen
}: Props) {
  console.log('log : ', reportField)
  
  function closeDrawer() {
    setDrawerOpen?.(false)
  }

  return (
    <>
      <button type="button" aria-label="Close drawer" className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[2px] my-0" onClick={closeDrawer} />

      <aside className="fixed right-0 top-0 z-40 h-full w-full max-w-2xl overflow-auto bg-white shadow-2xl">
        <Card className="h-full rounded-none border-0">
          <CardContent className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-950">พิมพ์เอกสาร/บันทึกเอกสาร</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">กรอกข้อมูลพื้นฐานและอัปโหลดเอกสาร</p>
              </div>
              <button type="button" onClick={closeDrawer} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50">
                <X className="h-5 w-5" />
              </button>
            </div>


          </CardContent>
        </Card>
      </aside>
    </>
  )
}