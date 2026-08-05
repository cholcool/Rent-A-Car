'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import DepositDrawer from '@/components/DepositDrawer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatBaht, formatThaiDate, getStatusBadgeClass, getStatusLabel } from '@/lib/ui-format'
import { Plus } from 'lucide-react'

type Row = any

export default function PaymentsClient({ initialBookings }: { initialBookings: Row[] }) {
  const [bookings, setBookings] = useState<Row[]>(initialBookings)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Row | null>(null)

  const totals = useMemo(() => {
    const totalAmount = bookings.reduce((sum, booking) => sum + Number(booking.netAmount ?? 0), 0)
    const paidAmount = bookings.reduce((sum, booking) => {
      const paymentSum = (booking.payments ?? []).reduce((s: number, payment: any) => s + Number(payment.amount ?? 0), 0)
      return sum + paymentSum
    }, 0)
    return { totalAmount, paidAmount, remainingAmount: Math.max(totalAmount - paidAmount, 0) }
  }, [bookings])

  function openDrawer(booking: Row) {
    setSelectedBooking(booking)
    setDrawerOpen(true)
    setBookings(booking)
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-normal text-slate-950">การชำระเงิน</h1>
          <p className="mt-3 text-lg font-bold text-slate-500">เพิ่มรายการชำระเงินและดูยอดคงเหลือของแต่ละ booking</p>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <Card><CardContent className="p-6"><div className="text-sm font-bold text-slate-500">ยอดรวมทั้งหมด</div><div className="mt-2 text-3xl font-extrabold text-slate-950">{formatBaht(totals.totalAmount)}</div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="text-sm font-bold text-slate-500">ชำระแล้ว</div><div className="mt-2 text-3xl font-extrabold text-emerald-600">{formatBaht(totals.paidAmount)}</div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="text-sm font-bold text-slate-500">คงเหลือ</div><div className="mt-2 text-3xl font-extrabold text-violet-700">{formatBaht(totals.remainingAmount)}</div></CardContent></Card>
      </section>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-slate-950">รายการเช่าทั้งหมด</h2>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm font-extrabold text-slate-950">
                  <th className="px-3 py-3">วันที่</th>
                  <th className="px-3 py-3">ลูกค้า</th>
                  <th className="px-3 py-3">รถ</th>
                  <th className="px-3 py-3 text-right">ยอดรวม</th>
                  <th className="px-3 py-3 text-right">จ่ายแล้ว</th>
                  <th className="px-3 py-3 text-right">คงเหลือ</th>
                  <th className="px-3 py-3">สถานะ</th>
                  <th className="px-3 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const paidAmount = (booking.payments ?? []).reduce((sum: number, payment: any) => sum + Number(payment.amount ?? 0), 0)
                  const remainingAmount = Math.max(Number(booking.netAmount ?? 0) - paidAmount, 0)
                  const customerName = `${booking.user?.firstName ?? ''} ${booking.user?.lastName ?? ''}`.trim()
                  const carName = `${booking.car?.brand?.name ?? ''} ${booking.car?.model ?? ''} (${booking.car?.license ?? '-'})`.trim()

                  return (
                    <tr key={booking.id} className="border-b border-slate-100 text-sm font-medium text-slate-700 last:border-0">
                      <td className="px-3 py-4">{formatThaiDate(booking.createdAt)}</td>
                      <td className="px-3 py-4">{customerName || booking.user?.userName}</td>
                      <td className="px-3 py-4">
                        <div className="font-semibold text-slate-900">{carName}</div>
                        <div className="text-xs text-slate-500">สัญญา {booking.contractNo ?? '-'}</div>
                      </td>
                      <td className="px-3 py-4 text-right font-semibold">{formatBaht(booking.netAmount)}</td>
                      <td className="px-3 py-4 text-right font-semibold text-emerald-700">{formatBaht(paidAmount)}</td>
                      <td className="px-3 py-4 text-right font-semibold text-violet-700">{formatBaht(remainingAmount)}</td>
                      <td className="px-3 py-4">
                        <Badge className={getStatusBadgeClass(booking.status)}>{getStatusLabel(booking.status)}</Badge>
                        <div className="mt-1 text-xs font-semibold text-slate-500">ใบเสร็จล่าสุด {booking.payments?.[0]?.receiptNo ?? '-'}</div>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button type="button" size="sm" onClick={() => openDrawer(booking)}>
                            <Plus className="mr-2 h-4 w-4" />
                            เพิ่มการจ่ายเงิน
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/documents/contract?bookingId=${booking.id}`}>สัญญา</Link>
                          </Button>
                          {booking.payments?.[0]?.id ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/documents/receipt?paymentId=${booking.payments[0].id}`}>ใบรับเงิน</Link>
                            </Button>
                          ) : (
                            <Button type="button" size="sm" variant="outline" disabled>
                              ใบรับเงิน
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {drawerOpen && selectedBooking && (
        <DepositDrawer
          itemsList={selectedBooking}
          setDrawerOpen={(open) => {
            setDrawerOpen(open)
            if (!open) setSelectedBooking(null)
          }}
        />
      )}
    </div>
  )
}
