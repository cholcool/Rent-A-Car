'use client'

import { useEffect, useMemo, useState } from 'react'
import { PaymentMethod, PaymentStatus } from '@prisma/client'
import { Card, CardContent, Button, Input, Select, Badge, SkeletonTable  } from '@/components/ui'
import { formatBaht, formatThaiDate, getStatusBadgeClass, getStatusLabel } from '@/lib/ui-format'
import { X, HandCoinsIcon, Printer } from 'lucide-react'
import { AlertDialogDestructive } from '@/components/AlertDialogDestructive'

type BookingRow = any

interface Props {
  itemsList: BookingRow | null
  setDrawerOpen?: (open: boolean) => void
}

type PaymentRow = {
  id: string
  receiptNo?: string | null
  amount: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentDate: string
}

export default function DepositDrawer({ itemsList, setDrawerOpen }: Props) {
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash)
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(true)

  const drivers = `${itemsList?.driver?.fullName ?? ''}`.trim()
  const carName = `${itemsList?.car?.brand?.name ?? ''} ${itemsList?.car?.model ?? ''} (${itemsList?.car?.license ?? '-'})`.trim()
  const products = `${itemsList?.product?.name}`.trim()
  const userCreate = `${itemsList?.user?.firstName ?? ''} ${itemsList?.user?.lastName ?? ''}`.trim()


  const summary = useMemo(() => {
    const totalAmount = Number(itemsList?.netAmount ?? 0)
    const paidAmount = payments.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
    return {
      totalAmount,
      paidAmount,
      remainingAmount: Math.max(totalAmount - paidAmount, 0),
    }
  }, [payments, itemsList])

  useEffect(() => {
    async function loadPayments() {
      if (!itemsList?.id) return
      const res = await fetch(`/api/bookings/${itemsList.id}/payments`)
      if (!res.ok) return
      const data = await res.json()
      setPayments(data.payments ?? [])
      setLoaded(false)
    }

    loadPayments()
  }, [itemsList?.id])

  function closeDrawer() {
    setDrawerOpen?.(false)
  }

  async function addPayment() {
    if (!itemsList?.id) return
    setBusy(true)
    try {
      const res = await fetch(`/api/bookings/${itemsList.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), paymentMethod }),
      })
      if (!res.ok) return
      const data = await res.json()
      setPayments((current) => [data.payment, ...current])
      setAmount('')
    } finally {
      setBusy(false)
    }
  }

  async function deletePayment(id: string) {
    const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    setPayments((current) => current.filter((row) => row.id !== id))
  }

  function printDocument () {

  }

  return (
    <>
      <button type="button" aria-label="Close drawer" className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[2px] p-o m-0" onClick={closeDrawer} />

      <aside className="fixed right-0 top-0 z-40 h-full w-full max-w-2xl overflow-auto bg-white shadow-2xl">
        <Card className="h-full rounded-none border-0">
          <CardContent className="flex h-full flex-col gap-4 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-950">สรุปรายการ | สรุปยอด</h2>
              </div>
              <button type="button" onClick={closeDrawer} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50">
                <X className="h-5 w-5" />
              </button>
            </div>

            {itemsList && (
              <section className="grid gap-2 rounded-2xl border border-slate-200 shadow p-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-bold text-slate-500">เลขสัญญา</div>
                  <div className="mt-1 text-lg font-extrabold text-slate-950">{itemsList.contractNo ?? '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500">วันที่ออกเอกสาร</div>
                  <div className="mt-1 text-lg font-extrabold text-slate-950">{formatThaiDate(itemsList.dateStart)} - {formatThaiDate(itemsList.dateEnd)}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500">ข้อมูลบริการ</div>
                  <div className="mt-1 text-lg font-extrabold text-slate-950">{products || '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500">ข้อมูลรถ</div>
                  <div className="mt-1 text-lg font-extrabold text-slate-950">{carName || '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500">ข้อมูลลูกค้า</div>
                  <div className="mt-1 text-lg font-extrabold text-slate-950">{drivers || '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500">ข้อมูลผู้ให้เช่า</div>
                  <div className="mt-1 text-lg font-extrabold text-slate-950">{userCreate || '-'}</div>
                </div>
              </section>
            )}

            {itemsList && (
              <section className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 shadow p-4 mb-4 md:grid-cols-3">
                <div className='flex md:justify-start justify-between items-center'>
                  <span className="text-xs font-bold text-slate-500">ยอดรวม</span>
                  <span className="ml-2 text-lg font-extrabold text-slate-950">{formatBaht(summary.totalAmount)}</span>
                </div>
                <div className='flex md:justify-start justify-between items-center'>
                  <span className="text-xs font-bold text-slate-500">จ่ายแล้ว</span>
                  <span className="ml-2 text-lg font-extrabold text-emerald-600">{formatBaht(summary.paidAmount)}</span>
                </div>
                <div className='flex md:justify-start justify-between items-center'>
                  <span className="text-xs font-bold text-slate-500">คงเหลือ</span>
                  <span className="ml-2 text-lg font-extrabold text-violet-700">{formatBaht(summary.remainingAmount)}</span>
                </div>
              </section>
            )}

            <section className="grid gap-3 md:grid-cols-[1fr_180px_auto_auto]">
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="จำนวนเงิน"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                <option value={PaymentMethod.Cash}>เงินสด</option>
                <option value={PaymentMethod.BankTransfer}>โอนเงิน</option>
              </Select>
              <Button type="button" onClick={addPayment} disabled={busy || !itemsList}>
                <HandCoinsIcon className="mr-1 h-4 w-4" />
                จ่ายเงิน
              </Button>
              <Button type="button" variant="outline" onClick={() => setAmount('')}>
                ล้าง
              </Button>
            </section>

            <section className="overflow-auto rounded border border-slate-200">
              <table className="w-full min-w-175 text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-sm font-extrabold text-slate-950">
                    <th className="px-4 py-3">เลขใบเสร็จ</th>
                    <th className="px-4 py-3">วันที่</th>
                    <th className="px-4 py-3">วิธีจ่าย</th>
                    <th className="px-4 py-3 text-right">จำนวนเงิน</th>
                    <th className="px-4 py-3">สถานะ</th>
                    <th className="w-10 text-center sticky bg-white right-0 p-3 drop-shadow-[-4px_0_4px_rgba(0,0,0,0.05)]">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-100 text-sm font-medium text-slate-700 last:border-0">
                      <td className="px-4 py-3 font-semibold text-slate-900">{payment.receiptNo ?? `#${payment.id.slice(0, 8)}`}</td>
                      <td className="px-4 py-3">{formatThaiDate(payment.paymentDate)}</td>
                      <td className="px-4 py-3">{payment.paymentMethod === PaymentMethod.Cash ? 'เงินสด' : 'โอนเงิน'}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatBaht(payment.amount)}</td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusBadgeClass(payment.paymentStatus)}>{getStatusLabel(payment.paymentStatus)}</Badge>
                      </td>
                      <td className="sticky right-0 bg-white p-3 border-l drop-shadow-[-4px_0_4px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-2">
                          <Button type="button" size="icon-sm" variant="outline" onClick={printDocument}>
                            <Printer className="h-4 w-4" />
                          </Button>
                          <AlertDialogDestructive onClick={() => deletePayment(payment.id)} variant={'destructive'} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && !loaded && (
                    <tr>
                      <td className="px-4 py-10 text-center text-slate-500" colSpan={6}>
                        ยังไม่มีรายการจ่ายเงิน
                      </td>
                    </tr>
                  )}
                  {payments.length === 0 && loaded && (
                    <tr>
                      <td className="px-4 py-10 text-center text-slate-500" colSpan={6}>
                        <SkeletonTable />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </CardContent>
        </Card>
      </aside>
    </>
  )
}
