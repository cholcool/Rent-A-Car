import type { LucideIcon } from 'lucide-react'
import { Car, CheckCircle2, Clock3, TrendingUp } from 'lucide-react'
import prisma from '@/lib/prisma'
import {
  formatBaht,
  formatCompactNumber,
  formatThaiDate,
  getStatusBadgeClass,
  getStatusLabel,
} from '@/lib/ui-format'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { serializePrismaRows } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

type StatCardProps = {
  title: string
  value: string
  unit: string
  icon: LucideIcon
  iconClassName: string
  valueClassName?: string
}

function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  iconClassName,
  valueClassName = 'text-slate-950',
}: StatCardProps) {
  return (
    <Card className="min-h-36">
      <CardContent className="flex h-full flex-col justify-between p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-slate-600">{title}</h2>
          <Icon className={iconClassName} aria-hidden="true" />
        </div>

        <div>
          <div className={`text-4xl font-extrabold leading-none ${valueClassName}`}>{value}</div>
          <div className="mt-2 text-sm font-bold text-slate-500">{unit}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const [totalCars, availableCars, activeRentals, monthlyRevenue, latestBookings] =
    await Promise.all([
      prisma.car.count({ where: { isDeleted: false } }),
      prisma.car.count({ where: { isDeleted: false, status: 'Available' } }),
      prisma.booking.count({
        where: {
          isDeleted: false,
          status: { in: ['Confirmed', 'InProgress'] },
        },
      }),
      prisma.booking.aggregate({
        where: {
          isDeleted: false,
          createdAt: {
            gte: monthStart,
            lt: nextMonthStart,
          },
          status: {
            notIn: ['Cancelled', 'Rejected'],
          },
        },
        _sum: { netAmount: true },
      }),
      prisma.booking.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: true,
          car: {
            include: {
              brand: true,
            },
          },
        },
      }),
    ])

  const latestBookingsRows = serializePrismaRows(latestBookings)

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-extrabold tracking-normal text-slate-950">Dashboard</h1>
        <p className="mt-3 text-lg font-bold text-slate-500">ภาพรวมระบบเช่ารถ</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="รถทั้งหมด"
          value={formatCompactNumber(totalCars)}
          unit="คัน"
          icon={Car}
          iconClassName="h-5 w-5 text-slate-400"
        />
        <StatCard
          title="รถว่าง"
          value={formatCompactNumber(availableCars)}
          unit="พร้อมให้เช่า"
          icon={CheckCircle2}
          iconClassName="h-6 w-6 text-emerald-500"
          valueClassName="text-emerald-600"
        />
        <StatCard
          title="กำลังเช่า"
          value={formatCompactNumber(activeRentals)}
          unit="คัน"
          icon={Clock3}
          iconClassName="h-6 w-6 text-blue-600"
          valueClassName="text-blue-700"
        />
        <StatCard
          title="รายได้เดือนนี้"
          value={formatBaht(monthlyRevenue._sum.netAmount)}
          unit="บาท"
          icon={TrendingUp}
          iconClassName="h-6 w-6 text-violet-500"
          valueClassName="text-violet-600"
        />
      </section>

      <div className="grid grid-cols-2 rounded-2xl bg-slate-200/70 p-1">
        <button
          type="button"
          className="rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-slate-950 shadow-sm"
        >
          ภาพรวม
        </button>
        <button type="button" className="rounded-xl px-4 py-3 text-sm font-extrabold text-slate-950">
          รายงาน
        </button>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold text-slate-950">รายการเช่าล่าสุด</h2>

          <div className="mt-7 overflow-x-auto">
            <table className="w-full min-w-205 text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm font-extrabold text-slate-950">
                  <th className="px-3 py-3">รหัส</th>
                  <th className="px-3 py-3">ลูกค้า</th>
                  <th className="px-3 py-3">รถ</th>
                  <th className="px-3 py-3">วันที่เริ่ม</th>
                  <th className="px-3 py-3">วันที่สิ้นสุด</th>
                  <th className="px-3 py-3 text-right">จำนวนเงิน</th>
                  <th className="px-3 py-3">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {latestBookingsRows.map((booking) => {
                  const customerName = `${booking.user.firstName} ${booking.user.lastName}`.trim()
                  const carName = `${booking.car.brand.name} ${booking.car.model} (${booking.car.license})`

                  return (
                    <tr
                      key={booking.id}
                      className="border-b border-slate-200 last:border-0 text-base font-semibold text-slate-900"
                    >
                      <td className="px-3 py-4">#{booking.id.slice(0, 6)}</td>
                      <td className="px-3 py-4">{customerName || booking.user.userName}</td>
                      <td className="px-3 py-4">{carName}</td>
                      <td className="px-3 py-4">{formatThaiDate(booking.dateStart)}</td>
                      <td className="px-3 py-4">{formatThaiDate(booking.dateEnd)}</td>
                      <td className="px-3 py-4 text-right">{formatBaht(booking.netAmount)}</td>
                      <td className="px-3 py-4">
                        <Badge className={getStatusBadgeClass(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {latestBookings.length === 0 && (
            <div className="py-12 text-center text-sm font-semibold text-slate-500">
              ยังไม่มีรายการเช่าในระบบ
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
