'use client'

import { useEffect, useState } from 'react'
import { CreditCard, FileText, Plus, Contact, X, Edit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AlertDialogDestructive } from '@/components/AlertDialogDestructive'
import DriverDrawer from '@/components/DriverDrawer'
import { DriverFormState, DriverRow, DriverEmptyForm } from '@/lib/types'


export default function DriverPageClient({ initialDrivers }: { initialDrivers: DriverRow[] }) {
  const [drivers, setDrivers] = useState(initialDrivers)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState<DriverFormState>(DriverEmptyForm)
  const [cardFile, setCardFile] = useState<File | null>(null)
  const [licenseFile, setLicenseFile] = useState<File | null>(null)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setDrawerOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(DriverEmptyForm)
    setCardFile(null)
    setLicenseFile(null)
    setError('')
    setDrawerOpen(true)
  }

  function openEdit(driver: DriverRow) {
    setEditingId(driver.id)
    setForm({
      fullName: driver.fullName,
      phone: driver.phone,
      remark: driver.remark,
      cardImageId: driver.cardImageId,
      licenseImageId: driver.licenseImageId,
    })
    setCardFile(null)
    setLicenseFile(null)
    setError('')
    setDrawerOpen(true)
  }

  async function deleteDriver(id: string) {
    const res = await fetch('/api/drivers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data?.error ?? 'ไม่สามารถลบข้อมูลได้')
      return
    }
    setDrivers((current) => current.filter((item) => item.id !== id))
  }

  const total = drivers.length
  const uploadedCardCount = drivers.filter((driver) => Boolean(driver.cardImage)).length
  const uploadedLicenseCount = drivers.filter((driver) => Boolean(driver.licenseImage)).length

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">ข้อมูลลูกค้า / ผู้ขับขี่</h1>
        <p className="max-w-3xl text-lg font-semibold text-slate-500">
          จัดการข้อมูลคนขับ เอกสาร และรูปบัตรประชาชน/ใบขับขี่
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="p-6"><div className="text-sm font-semibold text-slate-500">รายการทั้งหมด</div><div className="mt-2 text-3xl font-extrabold text-slate-950">{total}</div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="text-sm font-semibold text-slate-500">รูปบัตร</div><div className="mt-2 text-3xl font-extrabold text-emerald-600">{uploadedCardCount}</div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="text-sm font-semibold text-slate-500">รูปใบขับขี่</div><div className="mt-2 text-3xl font-extrabold text-emerald-600">{uploadedLicenseCount}</div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="text-sm font-semibold text-slate-500">สถานะหน้า</div><div className="mt-2 text-3xl font-extrabold text-slate-950">Ready</div></CardContent></Card>
      </section>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-950">รายการล่าสุด</h2>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-250 text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm font-extrabold text-slate-950">
                  <th className="px-3 py-3">ชื่อ-นามสกุล</th>
                  <th className="px-3 py-3">เบอร์โทรศัพท์</th>
                  <th className="px-3 py-3">เอกสาร</th>
                  <th className="px-3 py-3">หมายเหตุ</th>
                  <th className="px-3 py-3">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id} className="border-b border-slate-100 text-sm font-medium text-slate-700">
                    <td className="px-3 py-4 font-bold text-slate-950">{driver.fullName}</td>
                    <td className="px-3 py-4">{driver.phone}</td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={driver.cardImage ? 'success' : 'destructive'} className="gap-1.5">
                          <CreditCard className="h-3.5 w-3.5" />
                          {driver.cardImage ? 'บัตรประชาชน' : 'ยังไม่อัปโหลดบัตร'}
                        </Badge>
                        <Badge variant={driver.licenseImage ? 'success' : 'destructive'} className="gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          {driver.licenseImage ? 'ใบขับขี่' : 'ยังไม่อัปโหลดใบขับขี่'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-3 py-4">{driver.remark || '-'}</td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => openEdit(driver)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialogDestructive onClick={() => deleteDriver(driver.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {drawerOpen && (
        <DriverDrawer
          initialDrivers={initialDrivers}
          formIn={form}
          errorIn={error}
          editingId={editingId}
          licenseFile={licenseFile}
          setLicenseFile={setLicenseFile}
          cardFile={cardFile}
          setCardFile={setCardFile}
          setDrawerOpen={setDrawerOpen}
          setDrivers={setDrivers}
        />
      )}

      {menuOpen && (
        <button type="button" aria-label="Close menu" className="fixed inset-0 z-30 bg-transparent my-0" onClick={() => setMenuOpen(false)} /> 
      )}

      {!drawerOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
          {menuOpen && (
            <button type="button" onClick={openCreate} className={cn('group flex items-center gap-4 rounded-2xl border bg-white px-4 py-3 text-left shadow-lg shadow-slate-950/10 transition-all duration-200', 'min-w-47.5 max-w-55', 'border-slate-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/50')}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 shadow-sm transition group-hover:bg-white group-hover:text-violet-700">
                <Contact className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-slate-900">เพิ่มข้อมูลลูกค้าใหม่</div>
              </div>
            </button>
          )}
          
          <Button
            type="button"
            size="lg"
            onClick={() => setMenuOpen((value) => !value)}
            className={cn('h-14 w-14 rounded-xl border-2 border-violet-200 bg-violet-600 shadow-2xl shadow-violet-900/25', 'hover:bg-violet-700')}
          >
            {menuOpen ? <X className="h-7 w-7" /> : <Plus className="h-7 w-7" />}
          </Button>
        </div>
      )}
    </div>
  )
}
