'use client'

import { useEffect, useState } from 'react'
import { Edit, Plus, X, ClipboardList, FileDown, UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn, } from '@/lib/utils'
import { formatBaht, formatThaiDate, getStatusBadgeClass, getStatusLabel } from '@/lib/ui-format'
import { AlertDialogDestructive } from '@/components/AlertDialogDestructive'
import BookingsDrawer from '@/components/BookingsDrawer'
import DriverDrawer from '@/components/DriverDrawer'
import { BookingOption, DriverEmptyForm, GuarantorEmptyForm, type DriverRow } from '@/lib/types'
import ReportFieldDrawer from '@/components/ReportFieldDrawer'

type Row = any

interface BookingsClientProps {
  initialBookings: Row[]
  products: BookingOption[]
  cars: BookingOption[]
  drivers: BookingOption[]
  initialDrivers: DriverRow[]
  currentUserId: string
}

export default function BookingsClient({
  initialBookings,
  products,
  cars,
  drivers,
  initialDrivers,
  currentUserId,
}: BookingsClientProps) {
  const [bookings, setBookings] = useState<Row[]>(initialBookings)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [driverDrawerOpen, setDriverDrawerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [error, setError] = useState('')
  const [driverError, setDriverError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [driverEditingId, setDriverEditingId] = useState<string | null>(null)
  const [driversState, setDrivers] = useState<DriverRow[]>(initialDrivers)
  const empty = {
    productId: '',
    carId: '',
    userId: currentUserId,
    driverId: '',
    dateStart: undefined,
    dateEnd: undefined,
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
  const [reportField, setReportField] = useState<Row[] | null>(null)
  const [reportDrawerOpen, setReportDrawerOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setDrawerOpen(false)
        setDriverDrawerOpen(false)
        setReportDrawerOpen(false)
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
    setMenuOpen(false)
  }

  function openDriverCreate() {
    setDriverEditingId(null)
    setDriverError('')
    setDriverDrawerOpen(true)
    setMenuOpen(false)
  }

  function openEdit(row: Row) {
    setEditingId(row.id)
    setForm({
      productId: row.productId ?? '',
      carId: row.carId ?? '',
      userId: row.userId ?? currentUserId,
      driverId: row.driverId ?? '',
      dateStart: row.dateStart,
      dateEnd: row.dateEnd,
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
    setReportField(row)
    setReportDrawerOpen(true)
    setMenuOpen(false)
  }

  async function remove(id: string) {
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    setBookings((current) => current.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-8">

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
                <tr className="border-b border-slate-200 text-sm font-extrabold text-slate-950">
                  <th className="px-3 py-3">ข้อมูลลูกค้า</th>
                  <th className="px-3 py-3">รายการรถ</th>
                  <th className="px-3 py-3">ข้อมูลบริการ</th>
                  <th className="px-3 py-3">วันรับรถ - วันคืนรถ</th>
                  <th className="px-3 py-3 text-right">ยอดรวมสุทธิ</th>
                  <th className="px-3 py-3">สถานะ</th>
                  <th className="w-10 text-center sticky bg-white right-0 p-3 drop-shadow-[-4px_0_4px_rgba(0,0,0,0.05)]">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-slate-100 text-sm font-medium text-slate-700">
                    <td className="px-3 py-4 font-bold text-slate-950">{booking.driver?.fullName ?? ''}</td>
                    <td className="px-3 py-4">
                      <div>{`${booking.car?.brand?.name ?? ''} ${booking.car?.model ?? ''}`.trim()}</div>
                      <div className="text-xs text-slate-500">{booking.car?.license ?? '-'}</div>
                    </td>
                    <td className="px-3 py-4">
                      <div>{booking.product?.name.trim() || '-'}</div>
                      <div className="text-xs text-slate-500">{formatBaht(booking.product?.price)}</div>
                    </td>
                    <td className="px-3 py-4">{formatThaiDate(booking.dateStart)} - {formatThaiDate(booking.dateEnd)}</td>
                    <td className="px-3 py-4 text-right font-semibold">{formatBaht(booking.netAmount)}</td>
                    <td className="px-3 py-4"><Badge className={getStatusBadgeClass(booking.status)}>{getStatusLabel(booking.status)}</Badge></td>
                    <td className="sticky right-0 bg-white p-3 border-l drop-shadow-[-4px_0_4px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openFile(booking)} className='gap-2'><FileDown className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(booking)} className="gap-2"><Edit className="h-4 w-4" /></Button>
                        <AlertDialogDestructive onClick={() => remove(booking.id)} variant={'destructive'} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {menuOpen && (
        <button
          type="button"
          aria-label="Close speed dial"
          className="fixed inset-0 z-10 cursor-default bg-transparent"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {!drawerOpen && !driverDrawerOpen && (
        <div className="fixed bottom-6 right-6 z-10 flex flex-col items-end gap-3">
          {menuOpen && (
            <>
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
                  <div className="truncate text-sm font-bold text-slate-900">เพิ่มรายการใหม่</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  openDriverCreate()
                }}
                className={cn(
                  'group relative z-50 flex items-center gap-4 rounded-2xl border bg-white px-4 py-3 text-left shadow-lg shadow-slate-950/10 transition-all duration-200',
                  'min-w-47.5 max-w-60',
                  'border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 shadow-sm transition group-hover:bg-white group-hover:text-slate-900">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-900">เพิ่มข้อมูลลูกค้าใหม่</div>
                </div>
              </button>
            </>
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

      {driverDrawerOpen && (
        <DriverDrawer
          initialDrivers={driversState}
          editingId={driverEditingId}
          setDrawerOpen={setDriverDrawerOpen}
          setDrivers={setDrivers}
          formIn={DriverEmptyForm}
          formGuarantorIn={GuarantorEmptyForm}
          errorIn={driverError}
        />
      )}

      {reportDrawerOpen && (
        <ReportFieldDrawer 
          reportField={reportField} 
          setDrawerOpen={setReportDrawerOpen}
        />
      )}
    </div>
  )
}
