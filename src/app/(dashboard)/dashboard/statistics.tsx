
import prisma from '@/lib/prisma'
import type { ReactNode } from 'react'
import { 
  Card, 
  CardContent, 
  Badge 
} from '@/components/ui'
import {
  formatBaht,
  formatCompactNumber,
  getStatusLabel,
} from '@/lib/ui-format'
import {
  ListOrdered,
  TrendingUp,
} from 'lucide-react'
import { TabKey, StatCard } from './page'

type MonthlyRow = {
  monthKey: string
  monthLabel: string
  revenue: number
  bookingCount: number
}

type TopCarRow = {
  id: string
  label: string
  license: string
  bookings: number
}

type StatusRow = {
  status: string
  _count: { status: number }
}

function getThaiMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  }).format(date)
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function maxBy<T>(items: T[], getter: (item: T) => number) {
  return items.reduce((max, item) => Math.max(max, getter(item)), 0)
}

export async function StatisticsPage({ activeTab }: { activeTab: TabKey }) {
  const now = new Date()
  const sixMonthsAgoStart = addMonths(now, -5)
  const reportWindowEnd = addMonths(now, 1)

  const reportPromise = activeTab === 'reports'
    ? Promise.all([
        prisma.booking.aggregate({
          where: { isDeleted: false, status: { notIn: ['Cancelled', 'Rejected'] } },
          _sum: { netAmount: true },
          _count: { id: true },
        }),
        prisma.booking.findMany({
          where: {
            isDeleted: false,
            createdAt: {
              gte: sixMonthsAgoStart,
              lt: reportWindowEnd,
            },
            status: { notIn: ['Cancelled', 'Rejected'] },
          },
          select: {
            createdAt: true,
            netAmount: true,
          },
        }),
        prisma.booking.groupBy({
          by: ['carId'],
          where: { isDeleted: false },
          _count: { carId: true },
          orderBy: { _count: { carId: 'desc' } },
          take: 5,
        }),
        prisma.booking.groupBy({
          by: ['status'],
          where: { isDeleted: false },
          _count: { status: true },
          orderBy: { _count: { status: 'desc' } },
        }),
      ])
    : null

  const [reportData] = await Promise.all([reportPromise])

  const monthlyRows = (() => {
    if (!reportData) return []
    const [, recentBookings] = reportData
    const monthMap = new Map<string, { monthKey: string; monthLabel: string; revenue: number; bookingCount: number }>()

    for (let i = 5; i >= 0; i -= 1) {
      const monthDate = addMonths(now, -i)
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
      monthMap.set(monthKey, {
        monthKey,
        monthLabel: getThaiMonthLabel(monthDate),
        revenue: 0,
        bookingCount: 0,
      })
    }

    for (const booking of recentBookings) {
      const date = new Date(booking.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const row = monthMap.get(key)
      if (!row) continue
      row.revenue += Number(booking.netAmount ?? 0)
      row.bookingCount += 1
    }

    return Array.from(monthMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey))
  })()

  const topCarsData = async () => {
    if (!reportData) return []
    const [, , topCars] = reportData
    const carIds = topCars.map((row) => row.carId)

    const cars = await prisma.car.findMany({
      where: {
        isDeleted: false,
        id: { in: carIds },
      },
      select: {
        id: true,
        model: true,
        license: true,
        brand: { select: { name: true } },
      },
    })

    const carMap = new Map(cars.map((car) => [car.id, car]))

    return topCars
      .map((row) => {
        const car = carMap.get(row.carId)
        if (!car) return null
        return {
          id: car.id,
          label: `${car.brand.name} ${car.model}`.trim(),
          license: car.license,
          bookings: row._count.carId,
        }
      })
      .filter(Boolean)
  }

  const topCars = (await topCarsData()) as TopCarRow[]
  const reportStats = reportData
    ? {
        totalRevenue: reportData[0]._sum.netAmount ?? 0,
        totalBookings: reportData[0]._count.id ?? 0,
        statusGroups: reportData[3] as StatusRow[],
      }
    : null


  const revenueMax = maxBy(monthlyRows, (row) => row.revenue)
  const bookingMax = maxBy(monthlyRows, (row) => row.bookingCount)
  const topCarsMax = maxBy(topCars, (row) => row.bookings)

  function ChartShell({
    title,
    description,
    children,
  }: {
    title: string
    description: string
    children: ReactNode
  }) {
    return (
      <Card className="border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/60">
        <CardContent className="p-6 sm:p-8">
          <h3 className="text-xl font-black tracking-tight text-slate-950">{title}</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">{description}</p>
          <div className="mt-6">{children}</div>
        </CardContent>
      </Card>
    )
  }

  function GridLines({ rows = 4 }: { rows?: number }) {
    return (
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="absolute left-0 right-0 border-t border-slate-200/70"
            style={{ top: `${((index + 1) / (rows + 1)) * 100}%` }}
          />
        ))}
      </div>
    )
  }

  function MonthlyChart({
    rows,
    revenueMax,
    bookingMax,
  }: {
    rows: MonthlyRow[]
    revenueMax: number
    bookingMax: number
  }) {
    return (
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 overflow-hidden p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-700">รายได้รายเดือน</div>
            <div className="text-xs font-medium text-slate-500">ยอดเงินสุทธิ</div>
          </div>
          <div className="relative mt-4 h-full min-h-80 rounded-2xl bg-white p-4">
            <GridLines rows={4} />
            <div className="relative flex h-full gap-3 py-4">
              {rows.map((row) => {
                const height = revenueMax > 0 ? Math.max((row.revenue / revenueMax) * 100, 6) : 6
                return (
                  <div key={row.monthKey} className="flex flex-1 flex-col items-center gap-3">
                    <div className="flex h-full w-full items-end">
                      <div
                        className="group relative mx-auto w-full max-w-16 rounded-t-2xl bg-linear-to-t from-[#4E2788] via-[#6F3BB7] to-[#E0B21F] shadow-lg shadow-[#6F3BB7]/20 transition-transform hover:-translate-y-1"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute inset-x-0 -top-8 text-center text-xs font-bold text-slate-700 opacity-0 transition-opacity group-hover:opacity-100">
                          {formatBaht(row.revenue)}
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-xs font-semibold text-slate-600">{row.monthLabel.slice(0, 4)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-700">จำนวนการจอง</div>
            <div className="text-xs font-medium text-slate-500">6 เดือนล่าสุด</div>
          </div>
          <div className="mt-4 space-y-4">
            {rows.map((row) => {
              const width = bookingMax > 0 ? Math.max((row.bookingCount / bookingMax) * 100, 8) : 8
              return (
                <div key={row.monthKey} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">{row.monthLabel}</span>
                    <span className="font-black text-slate-950">{formatCompactNumber(row.bookingCount)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-[#6F3BB7] to-[#E0B21F]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  function DonutChart({ rows, total }: { rows: StatusRow[]; total: number }) {
    const size = 220
    const radius = 74
    const strokeWidth = 22
    const center = size / 2
    const circumference = 2 * Math.PI * radius
    const colors = ['#4f46e5', '#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6']
    let offset = 0

    return (
      <div className="flex flex-col items-center gap-4">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-56 w-56">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
          {rows.map((row, index) => {
            const value = row._count.status
            const dashArray = total > 0 ? (value / total) * circumference : 0
            const segment = (
              <circle
                key={row.status}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={colors[index % colors.length]}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${dashArray} ${circumference - dashArray}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${center} ${center})`}
              />
            )
            offset += dashArray
            return segment
          })}
          <text x={center} y={center - 2} textAnchor="middle" className="fill-slate-500 text-[12px] font-semibold">
            ทั้งหมด
          </text>
          <text x={center} y={center + 20} textAnchor="middle" className="fill-slate-950 text-[22px] font-black">
            {formatCompactNumber(total)}
          </text>
        </svg>

        <div className="grid w-full gap-2">
          {rows.map((row, index) => (
            <div key={row.status} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                <span className="text-sm font-semibold text-slate-700">{getStatusLabel(row.status)}</span>
              </div>
              <span className="text-sm font-black text-slate-950">{formatCompactNumber(row._count.status)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function TopCarsChart({ rows, maxBookings }: { rows: TopCarRow[]; maxBookings: number }) {
    return (
      <div className="space-y-4">
        {rows.map((car, index) => {
          const width = maxBookings > 0 ? Math.max((car.bookings / maxBookings) * 100, 10) : 10
          return (
            <div key={car.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <Badge className="h-7 min-w-7 rounded-full px-2.5 text-xs font-black">#{index + 1}</Badge>
                  <div className="min-w-0">
                    <div className="truncate font-bold text-slate-950">{car.label}</div>
                    <div className="mt-1 text-sm text-slate-500">ทะเบียน {car.license}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">การจอง</div>
                  <div className="text-lg font-black text-emerald-700">{formatCompactNumber(car.bookings)}</div>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-linear-to-r from-emerald-500 to-indigo-500"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }
  return (
    <>
    {activeTab === 'reports' && reportStats && (
        <div className="space-y-8">
          <section className="grid gap-6 md:grid-cols-2">
            <StatCard
              title="รายได้สะสมทั้งหมด"
              value={formatBaht(reportStats.totalRevenue)}
              unit="บาท"
              icon={TrendingUp}
              iconClassName="h-6 w-6 text-[#6F3BB7]"
              valueClassName="text-[#4E2788]"
            />
            <StatCard
              title="จำนวนการจองทั้งหมด"
              value={formatCompactNumber(reportStats.totalBookings)}
              unit="รายการ"
              icon={ListOrdered}
              iconClassName="h-6 w-6 text-emerald-600"
              valueClassName="text-emerald-700"
            />
          </section>

          <ChartShell
            title="ภาพรวมข้อมูลสถิติ"
            description="รวมกราฟรายได้รายเดือน, จำนวนการจอง, รถยอดนิยม และสถานะการจองไว้ในที่เดียว"
          >
            <MonthlyChart rows={monthlyRows} revenueMax={revenueMax} bookingMax={bookingMax} />
          </ChartShell>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2 border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/60 overflow-auto">
              <CardContent className="p-6 sm:p-8">
                <h3 className="text-xl font-black tracking-tight text-slate-950">ตารางรายได้ย้อนหลัง 6 เดือน</h3>
                <p className="mt-2 text-sm font-medium text-slate-500">ดูตัวเลขแบบละเอียดพร้อมใช้ตรวจสอบย้อนหลัง</p>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-165 text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        <th className="px-3 py-3">เดือน</th>
                        <th className="px-3 py-3 text-right">รายได้</th>
                        <th className="px-3 py-3 text-right">จำนวนการจอง</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyRows.map((row) => (
                        <tr key={row.monthKey} className="border-b border-slate-100 last:border-0">
                          <td className="px-3 py-4 font-semibold text-slate-950">{row.monthLabel}</td>
                          <td className="px-3 py-4 text-right font-bold text-slate-950">{formatBaht(row.revenue)}</td>
                          <td className="px-3 py-4 text-right font-semibold text-slate-600">
                            {formatCompactNumber(row.bookingCount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <ChartShell title="รถยอดนิยม 5 อันดับแรก" description="รถที่ถูกจองมากที่สุดในระบบ">
                <TopCarsChart rows={topCars} maxBookings={topCarsMax} />
              </ChartShell>

              <ChartShell title="สัดส่วนสถานะการจอง" description="แสดงสัดส่วนของแต่ละสถานะด้วยโดนัทชาร์ต">
                <DonutChart rows={reportStats.statusGroups} total={reportStats.totalBookings} />
              </ChartShell>
            </div>
          </div>
        </div>
      )}
    </>
  )
}