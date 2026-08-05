'use client'

import { Card, CardContent, Button } from '@/components/ui'
import { Printer, X } from 'lucide-react'

interface Props {
  setDrawerOpen?: (open: boolean) => void
}

export default function ReportFieldDrawer({ setDrawerOpen }: Props) {
  function closeDrawer() {
    setDrawerOpen?.(false)
  }

  function printDocument() {
    window.print()
  }

  return (
    <>
      <button type="button" aria-label="Close drawer" className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[2px]" onClick={closeDrawer} />
      
      <aside className="fixed right-0 top-0 z-40 h-full w-full max-w-2xl overflow-auto bg-white shadow-2xl">
        <Card className="h-full rounded-none border-0">
          <CardContent className="flex h-full flex-col gap-6 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-950">พิมพ์เอกสาร/บันทึกเอกสาร</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">เอกสารตรวจรับรถก่อนส่งมอบ และ พิมพ์เอกสารการรับเงิน</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={printDocument}>
                  <Printer className="mr-2 h-4 w-4" />
                  พิมพ์
                </Button>
                <button type="button" onClick={closeDrawer} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <section className="rounded-2xl border border-dashed border-slate-300 p-6">
              <h3 className="text-lg font-extrabold text-slate-950">เอกสารที่รองรับ</h3>
              <ul className="mt-3 space-y-2 text-sm font-medium text-slate-600">
                <li>1. เอกสารตรวจรับรถก่อนส่งมอบ (Vehicle Health Check) + เอกสารสัญญาค่าบริการ 1 Item</li>
                <li>2. พิมพ์เอกสารการรับเงิน/มัดจำ 1Item</li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </aside>
    </>
  )
}
