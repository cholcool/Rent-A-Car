'use client'

import { Button, Badge } from '@/components/ui'
import { Printer, FileText } from 'lucide-react'
import { getStatusBadgeClass, getStatusLabel } from '@/lib/ui-format'

type BookingRow = any
type PaymentRow = any

export default function DocumentPreview({
  mode,
  booking,
  payment,
  formatBaht,
}: {
  mode: 'contract' | 'receipt'
  booking?: BookingRow | null
  payment?: PaymentRow | null
  formatBaht: (value: unknown) => string
}) {
  function printPage() {
    window.print()
  }

  if (mode === 'contract' && !booking) return null
  if (mode === 'receipt' && !payment) return null

  return (
    <div className="space-y-6">
      <header className="print:hidden flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-normal text-slate-950">
            {mode === 'contract' ? 'สัญญาค่าบริการ' : 'ใบเสร็จรับเงิน'}
          </h1>
          <p className="mt-3 text-lg font-bold text-slate-500">
            {mode === 'contract'
              ? 'เอกสารตรวจรับรถก่อนส่งมอบและสัญญาค่าบริการ'
              : 'เอกสารรับเงินหรือมัดจำ 1 รายการ'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={printPage}>
            <Printer className="mr-2 h-4 w-4" />
            พิมพ์ / Save as PDF
          </Button>
        </div>
      </header>

      {mode === 'contract' && booking && (
        <section className="rounded-3xl border border-slate-300 bg-white p-8 shadow-sm print:shadow-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                <FileText className="h-4 w-4" />
                Contract No.
              </div>
              <div className="mt-2 text-3xl font-extrabold text-slate-950">{booking.contractNo ?? '-'}</div>
            </div>
            <Badge className={getStatusBadgeClass(booking.status)}>{getStatusLabel(booking.status)}</Badge>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Field label="ลูกค้า" value={`${booking.user?.firstName ?? ''} ${booking.user?.lastName ?? ''}`.trim()} />
            <Field label="รถ" value={`${booking.car?.brand?.name ?? ''} ${booking.car?.model ?? ''} (${booking.car?.license ?? '-'})`.trim()} />
            <Field label="วันรับรถ" value={booking.dateStartLabel ?? booking.dateStart ?? '-'} />
            <Field label="วันคืนรถ" value={booking.dateEndLabel ?? booking.dateEnd ?? '-'} />
            <Field label="ยอดรวม" value={formatBaht(booking.netAmount)} emphasize="emerald" />
            <Field label="จ่ายแล้ว" value={formatBaht((booking.payments ?? []).reduce((sum: number, row: any) => sum + Number(row.amount ?? 0), 0))} emphasize="violet" />
            <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-600">
              เอกสารฉบับนี้ใช้สำหรับงานตรวจรับรถก่อนส่งมอบและสัญญาค่าบริการ
            </div>
          </div>
        </section>
      )}

      {mode === 'receipt' && payment && (
        <section className="rounded-3xl border border-slate-300 bg-white p-8 shadow-sm print:shadow-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                <FileText className="h-4 w-4" />
                Receipt No.
              </div>
              <div className="mt-2 text-3xl font-extrabold text-slate-950">{payment.receiptNo ?? '-'}</div>
            </div>
            <Badge className={getStatusBadgeClass(payment.paymentStatus)}>{getStatusLabel(payment.paymentStatus)}</Badge>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Field label="วันที่รับเงิน" value={payment.paymentDateLabel ?? payment.paymentDate ?? '-'} />
            <Field label="วิธีจ่าย" value={payment.paymentMethod === 'Cash' ? 'เงินสด' : 'โอนเงิน'} />
            <Field label="ลูกค้า" value={`${payment.booking?.user?.firstName ?? ''} ${payment.booking?.user?.lastName ?? ''}`.trim()} />
            <Field label="รถ" value={`${payment.booking?.car?.brand?.name ?? ''} ${payment.booking?.car?.model ?? ''} (${payment.booking?.car?.license ?? '-'})`.trim()} />
            <Field label="จำนวนเงิน" value={formatBaht(payment.amount)} emphasize="emerald" />
            <Field label="เลขสัญญา" value={payment.booking?.contractNo ?? '-'} />
            <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-600">
              เอกสารฉบับนี้ใช้สำหรับการรับเงินหรือมัดจำ 1 รายการ
            </div>
          </div>
        </section>
      )}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}

function Field({
  label,
  value,
  emphasize,
}: {
  label: string
  value: string
  emphasize?: 'emerald' | 'violet'
}) {
  return (
    <div>
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div
        className={[
          'mt-1 text-lg font-semibold text-slate-900',
          emphasize === 'emerald' ? 'text-emerald-700' : '',
          emphasize === 'violet' ? 'text-violet-700' : '',
        ].join(' ')}
      >
        {value}
      </div>
    </div>
  )
}
