import prisma from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatBaht, formatThaiDate, getStatusBadgeClass, getStatusLabel } from '@/lib/ui-format'
import { serializePrismaRows } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
  const [payments, totalPayments, paidPayments] = await Promise.all([
    prisma.payment.findMany({
      where: { isDeleted: false },
      orderBy: { paymentDate: 'desc' },
      take: 40,
      include: {
        booking: {
          include: {
            user: true,
            car: { include: { brand: true } },
          },
        },
      },
    }),
    prisma.payment.count({ where: { isDeleted: false } }),
    prisma.payment.count({ where: { isDeleted: false, paymentStatus: 'Paid' } }),
  ])

  const paymentRows = serializePrismaRows(payments)

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-extrabold tracking-normal text-slate-950">การชำระเงิน</h1>
        <p className="mt-3 text-lg font-bold text-slate-500">ตรวจสอบประวัติการรับเงินและสถานะชำระเงิน</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-bold text-slate-500">รายการชำระเงิน</div>
            <div className="mt-2 text-4xl font-extrabold text-slate-950">{totalPayments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-bold text-slate-500">ชำระแล้ว</div>
            <div className="mt-2 text-4xl font-extrabold text-emerald-600">{paidPayments}</div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold text-slate-950">รายการล่าสุด</h2>
          <div className="mt-7 overflow-x-auto">
            <table className="w-full min-w-220 text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm font-extrabold text-slate-950">
                  <th className="px-3 py-3">รหัส</th>
                  <th className="px-3 py-3">วันที่</th>
                  <th className="px-3 py-3">ลูกค้า</th>
                  <th className="px-3 py-3">รถ</th>
                  <th className="px-3 py-3">วิธีชำระ</th>
                  <th className="px-3 py-3 text-right">จำนวนเงิน</th>
                  <th className="px-3 py-3">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {paymentRows.map((payment) => {
                  const booking = payment.booking
                  const customerName = `${booking.user.firstName} ${booking.user.lastName}`.trim()
                  const carName = `${booking.car.brand.name} ${booking.car.model} (${booking.car.license})`

                  return (
                    <tr
                      key={payment.id}
                      className="border-b border-slate-200 text-base font-semibold text-slate-900 last:border-0"
                    >
                      <td className="px-3 py-4">#{payment.id.slice(0, 8)}</td>
                      <td className="px-3 py-4">{formatThaiDate(payment.paymentDate)}</td>
                      <td className="px-3 py-4">{customerName || booking.user.userName}</td>
                      <td className="px-3 py-4">{carName}</td>
                      <td className="px-3 py-4">{payment.paymentMethod}</td>
                      <td className="px-3 py-4 text-right">{formatBaht(payment.amount)}</td>
                      <td className="px-3 py-4">
                        <Badge className={getStatusBadgeClass(payment.paymentStatus)}>
                          {getStatusLabel(payment.paymentStatus)}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {payments.length === 0 && (
            <div className="py-12 text-center text-sm font-semibold text-slate-500">
              ยังไม่มีรายการชำระเงินในระบบ
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
