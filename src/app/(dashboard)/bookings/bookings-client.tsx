'use client'

import { useEffect, useState } from 'react'
import { Edit, Plus, X, ClipboardList, FileDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatBaht, formatThaiDate, getStatusBadgeClass, getStatusLabel } from '@/lib/ui-format'
import { AlertDialogDestructive } from '@/components/AlertDialogDestructive'
import BookingsDrawer from '@/components/BookingsDrawer'


type Row = any
type Option = { id: string; label: string; price?: number }

function toDatetimeLocal(value?: string | Date | null) {
  if (!value) return ''
  const d = new Date(value)
  const tzOffset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
}
export default function BookingsClient({
  initialBookings,
  products,
  cars,
  drivers,
  currentUserId,
}: {
  initialBookings: Row[]
  products: Option[]
  cars: Option[]
  drivers: Option[]
  currentUserId: string
}) {
  const [bookings, setBookings] = useState<Row[]>(initialBookings)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const empty = {
    productId: '',
    carId: '',
    userId: currentUserId,
    driverId: '',
    dateStart: '',
    dateEnd: '',
    price: '0',
    discountAmount: '0',
    taxAmount: '0',
    bookingStatus: 'Pending',
    bookingRemark: '',
    paymentImageId: '',
    healthCheck01ImageId: '',
    healthCheck02ImageId: '',
  }
  const [form, setForm] = useState(empty)  
  const totalCount = bookings.length
  const pendingCount = bookings.filter((booking) => booking.status === 'Pending').length
  const activeCount = bookings.filter((booking) => ['Confirmed', 'InProgress'].includes(booking.status)).length
  const completeCount = bookings.filter((booking) => booking.status === 'Completed').length

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setDrawerOpen(true)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm({ ...empty, userId: currentUserId, bookingStatus: 'Pending' })
    setError('')
    setDrawerOpen(true)
  }

  function openEdit(row: Row) {
    setEditingId(row.id)
    setForm({
      productId: row.productId ?? '',
      carId: row.carId ?? '',
      userId: row.userId ?? currentUserId,
      driverId: row.driverId ?? '',
      dateStart: toDatetimeLocal(row.dateStart),
      dateEnd: toDatetimeLocal(row.dateEnd),
      price: String(row.price ?? row.product?.price ?? '0'),
      discountAmount: String(row.discountAmount ?? 0),
      taxAmount: String(row.taxAmount ?? 0),
      bookingStatus: row.status ?? 'Pending',
      bookingRemark: row.remark ?? '',
      paymentImageId: row.paymentImageId ?? '',
      healthCheck01ImageId: row.healthCheck01ImageId ?? '',
      healthCheck02ImageId: row.healthCheck02ImageId ?? '',
    })
    setError('')
    setDrawerOpen(true)
  }

  function openFile(row: Row) {
    console.log('open file', row)
  }

  async function remove(id: string) {
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    setBookings((current) => current.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-950">รายการเช่ารถ / จองรถ</h1>
          <p className="max-w-3xl text-lg font-semibold text-slate-500">จัดการรายการจอง อัปโหลดเอกสาร และบันทึกยอดโดยใช้รูปแบบเดียวกับหน้าข้อมูลลูกค้า / ผู้ขับขี่</p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="p-6"><div className="text-sm font-semibold text-slate-500">รายการทั้งหมด</div><div className="mt-2 text-3xl font-extrabold text-slate-950">{totalCount}</div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="text-sm font-semibold text-slate-500">รอยืนยัน</div><div className="mt-2 text-3xl font-extrabold text-amber-600">{pendingCount}</div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="text-sm font-semibold text-slate-500">กำลังดำเนินการ</div><div className="mt-2 text-3xl font-extrabold text-blue-700">{activeCount}</div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="text-sm font-semibold text-slate-500">เสร็จสิ้น</div><div className="mt-2 text-3xl font-extrabold text-emerald-600">{completeCount}</div></CardContent></Card>
      </section>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-950">รายการล่าสุด</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="mt-6 w-full min-w-275 text-left">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-3 py-3 text-sm font-extrabold text-slate-950">ลูกค้า / ผู้เช่า</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-sm font-extrabold text-slate-950">รถที่จอง</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-sm font-extrabold text-slate-950">วันรับรถ - วันคืนรถ</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-sm font-extrabold text-slate-950 text-right">ยอดรวมสุทธิ</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-sm font-extrabold text-slate-950">สถานะ</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-sm font-extrabold text-slate-950">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-slate-100 text-sm font-medium text-slate-700">
                    <td className="px-3 py-4 font-bold text-slate-950">{booking.driver?.fullName ?? ''}</td>
                    <td className="px-3 py-4">{`${booking.car?.brand?.name ?? ''} ${booking.car?.model ?? ''}`.trim()}</td>
                    <td className="px-3 py-4">{formatThaiDate(booking.dateStart)} - {formatThaiDate(booking.dateEnd)}</td>
                    <td className="px-3 py-4 text-right font-semibold">{formatBaht(booking.netAmount)}</td>
                    <td className="px-3 py-4"><Badge className={getStatusBadgeClass(booking.status)}>{getStatusLabel(booking.status)}</Badge></td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openFile(booking)} className='gap-2'><FileDown className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(booking)} className="gap-2"><Edit className="h-4 w-4" /></Button>
                        <AlertDialogDestructive onClick={() => remove(booking.id)} />
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
        <>
         <BookingsDrawer
            products={products}
            cars={cars}
            drivers={drivers}
            currentUserId={currentUserId}
            editingId={editingId}
            formIn={form}
            errorIn={error}
            setDrawerOpen={setDrawerOpen}
            setBookings={setBookings}
         />
        </>
      )}

      {!drawerOpen && menuOpen && (
        <button
          type="button"
          aria-label="ปิดเมนูเพิ่มรายการเช่ารถ"
          className="fixed inset-0 z-40 cursor-default bg-transparent"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {!drawerOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          {menuOpen && (
            <button 
              type="button" 
              onClick={() => {
                setMenuOpen(false)
                openCreate()
              }}
              className={cn(
                'group relative z-50 flex items-center gap-4 rounded-2xl border bg-white px-4 py-3 text-left shadow-lg shadow-slate-950/10 transition-all duration-200',
                'min-w-47.5 max-w-60',
                'border-slate-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/50'
              )}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 shadow-sm transition group-hover:bg-white group-hover:text-violet-700">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-slate-900">เพิ่มรายการเช่ารถใหม่</div>
              </div>
            </button>
          )}
          
          <Button
            type="button"
            size="lg"
            onClick={() => setMenuOpen((value) => !value)}
            className={cn('relative z-50 h-14 w-14 rounded-xl border-2 border-violet-200 bg-violet-600 shadow-2xl shadow-violet-900/25', 'hover:bg-violet-700')}
          >
            {menuOpen ? <X className="h-7 w-7" /> : <Plus className="h-7 w-7" />}
          </Button>
        </div>
      )}
    </div>
  )
}
