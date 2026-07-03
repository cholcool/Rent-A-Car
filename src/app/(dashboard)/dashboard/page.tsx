import type { LucideIcon } from 'lucide-react'
import {
  ArrowUpRight,
  Car,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  LayoutGrid,
  ListOrdered,
  TrendingUp,
} from 'lucide-react'
import prisma from '@/lib/prisma'
import {
  formatBaht,
  formatCompactNumber,
  formatThaiDate,
  getStatusBadgeClass,
  getStatusLabel,
} from '@/lib/ui-format'
import { serializePrismaRows } from '@/lib/serialize'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type TabKey = 'overview' | 'reports'

type StatCardProps = {
  title: string
  value: string
  unit: string
  icon: LucideIcon
  iconClassName: string
  valueClassName?: string
}

function StatCard({ title, value, unit, icon: Icon, iconClassName, valueClassName = 'text-slate-950' }: StatCardProps) {
  return (
    <Card className="border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/60 backdrop-blur">
      <CardContent className="flex h-full flex-col justify-between p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          </div>
          <Icon className={iconClassName} aria-hidden="true" />
        </div>

        <div className="mt-6">
          <div className={cn('text-4xl font-black leading-none tracking-tight', valueClassName)}>{value}</div>
          <div className="mt-2 text-sm font-semibold text-slate-500">{unit}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function getThaiMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  }).format(date)
}

function getTabValue(params: Record<string, string | string[] | undefined>): TabKey {
  const tab = typeof params.tab === 'string' ? params.tab : 'overview'
  return tab === 'reports' ? 'reports' : 'overview'
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const activeTab = getTabValue(params)

  const now = new Date()
  const currentMonthStart = monthStart(now)
  const nextMonthStart = addMonths(now, 1)
  const sixMonthsAgoStart = addMonths(now, -5)
  const reportWindowEnd = addMonths(now, 1)

  const overviewPromise = activeTab === 'overview'
    ? Promise.all([
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
              gte: currentMonthStart,
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
            product: true,
            driver: true,
            car: {
              include: {
                brand: true,
              },
            },
          },
        }),
      ])
    : null

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
            id: true,
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

  const [overviewData, reportData] = await Promise.all([overviewPromise, reportPromise])

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
      include: {
        brand: true,
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

  const topCars = await topCarsData()
  const reportStats = reportData
    ? {
        totalRevenue: reportData[0]._sum.netAmount ?? 0,
        totalBookings: reportData[0]._count.id ?? 0,
        statusGroups: reportData[3],
      }
    : null

  const overviewStats = overviewData
    ? {
        totalCars: overviewData[0],
        availableCars: overviewData[1],
        activeRentals: overviewData[2],
        monthlyRevenue: overviewData[3],
        latestBookings: serializePrismaRows(overviewData[4]),
      }
    : null

  const tabLinkClass = (tab: TabKey) =>
    cn(
      'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
      activeTab === tab
        ? 'bg-white text-slate-950 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200'
        : 'text-slate-500 hover:bg-white/60 hover:text-slate-950'
    )

  return (
    <div className="space-y-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-linear-to-b from-indigo-100/70 via-slate-50 to-transparent" />

      <header className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-200/70 backdrop-blur sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">
              <LayoutGrid className="h-3.5 w-3.5" />
              Dashboard
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Dashboard</h1>
            <p className="mt-3 text-base font-medium leading-7 text-slate-600 sm:text-lg">
              ติดตามสถานะรถ รายได้ และแนวโน้มการจองได้อย่างรวดเร็วจากภาพรวมและรายงานเชิงลึก
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-88">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">โหมดปัจจุบัน</div>
              <div className="mt-1 text-lg font-black text-slate-950">
                {activeTab === 'overview' ? 'ภาพรวม' : 'รายงาน'}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">อัปเดตแบบ</div>
              <div className="mt-1 text-lg font-black text-emerald-900">Real-time</div>
            </div>
          </div>
        </div>

        <nav className="mt-8 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
          <a href="?tab=overview" className={tabLinkClass('overview')}>
            <Car className="h-4 w-4" />
            ภาพรวม
          </a>
          <a href="?tab=reports" className={tabLinkClass('reports')}>
            <TrendingUp className="h-4 w-4" />
            รายงาน
          </a>
        </nav>
      </header>

      {activeTab === 'overview' && overviewStats && (
        <>
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="รถทั้งหมด"
              value={formatCompactNumber(overviewStats.totalCars)}
              unit="คัน"
              icon={Car}
              iconClassName="h-5 w-5 text-slate-400"
            />
            <StatCard
              title="รถว่างพร้อมใช้งาน"
              value={formatCompactNumber(overviewStats.availableCars)}
              unit="คัน"
              icon={CheckCircle2}
              iconClassName="h-6 w-6 text-emerald-500"
              valueClassName="text-emerald-600"
            />
            <StatCard
              title="กำลังเช่า"
              value={formatCompactNumber(overviewStats.activeRentals)}
              unit="รายการ"
              icon={Clock3}
              iconClassName="h-6 w-6 text-indigo-600"
              valueClassName="text-indigo-700"
            />
            <StatCard
              title="รายได้เดือนนี้"
              value={formatBaht(overviewStats.monthlyRevenue._sum.netAmount ?? 0)}
              unit="บาท"
              icon={CircleDollarSign}
              iconClassName="h-6 w-6 text-emerald-600"
              valueClassName="text-emerald-700"
            />
          </section>

          <Card className="border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/60">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">รายการเช่าล่าสุด</h2>
                  <p className="mt-2 text-sm font-medium text-slate-500">5 รายการล่าสุดจากระบบ</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-275 text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      <th className="px-3 py-3">ชื่อลูกค้า</th>
                      <th className="px-3 py-3">ข้อมูลรถ</th>
                      <th className="px-3 py-3">ข้อมูลบริการ</th>
                      <th className="px-3 py-3">วันเริ่ม</th>
                      <th className="px-3 py-3">วันสิ้นสุด</th>
                      <th className="px-3 py-3 text-right">จำนวนเงินสุทธิ</th>
                      <th className="px-3 py-3">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overviewStats.latestBookings.map((booking) => {
                      const carName = `${booking.car?.brand?.name ?? ''} ${booking.car?.model ?? ''}`.trim()

                      return (
                        <tr
                          key={booking.id}
                          className="border-b border-slate-100 text-sm font-medium text-slate-900 last:border-0 hover:bg-slate-50/70"
                        >
                          <td className="px-3 py-4">{booking.driver?.fullName.trim() || '-'}</td>
                          <td className="px-3 py-4">
                            <div className="font-semibold text-slate-950">{carName || '-'}</div>
                            <div className="text-xs text-slate-500">{booking.car?.license ?? '-'}</div>
                          </td>
                          <td className="px-3 py-4">
                            <div className="font-semibold text-slate-950">{booking.product?.name.trim() || '-'}</div>
                            <div className="text-xs text-slate-500">{formatBaht(booking.product?.price)}</div>
                          </td>
                          <td className="px-3 py-4">{formatThaiDate(booking.dateStart)}</td>
                          <td className="px-3 py-4">{formatThaiDate(booking.dateEnd)}</td>
                          <td className="px-3 py-4 text-right font-bold text-slate-950">
                            {formatBaht(booking.netAmount)}
                          </td>
                          <td className="px-3 py-4">
                            <Badge className={getStatusBadgeClass(booking.status)}>{getStatusLabel(booking.status)}</Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {overviewStats.latestBookings.length === 0 && (
                <div className="py-12 text-center text-sm font-semibold text-slate-500">
                  ยังไม่มีรายการเช่าในระบบ
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'reports' && reportStats && (
        <div className="space-y-8">
          <section className="grid gap-6 md:grid-cols-2">
            <StatCard
              title="รายได้สะสมทั้งหมด"
              value={formatBaht(reportStats.totalRevenue)}
              unit="บาท"
              icon={TrendingUp}
              iconClassName="h-6 w-6 text-indigo-600"
              valueClassName="text-indigo-700"
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

          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2 border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/60">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-black tracking-tight text-slate-950">รายได้ย้อนหลัง 6 เดือน</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">สรุปตามเดือนภาษาไทยพร้อมจำนวนครั้งการจอง</p>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-195 text-left">
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
              <Card className="border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/60">
                <CardContent className="p-6">
                  <h3 className="text-xl font-black tracking-tight text-slate-950">รถยอดนิยม 5 อันดับแรก</h3>
                  <div className="mt-5 space-y-4">
                    {topCars.map((car: any, index) => (
                      <div
                        key={car.id}
                        className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
                      >
                        <Badge className="h-7 min-w-7 rounded-full px-2.5 text-xs font-black">
                          #{index + 1}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-bold text-slate-950">{car.label}</div>
                          <div className="mt-1 text-sm text-slate-500">ทะเบียน {car.license}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            การจอง
                          </div>
                          <div className="text-lg font-black text-emerald-700">{car.bookings}</div>
                        </div>
                      </div>
                    ))}

                    {topCars.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-500">
                        ยังไม่มีข้อมูลรถยอดนิยม
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/60">
                <CardContent className="p-6">
                  <h3 className="text-xl font-black tracking-tight text-slate-950">สัดส่วนสถานะการจอง</h3>
                  <div className="mt-5 space-y-3">
                    {reportStats.statusGroups.map((row) => (
                      <div
                        key={row.status}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                      >
                        <Badge className={getStatusBadgeClass(row.status)}>{getStatusLabel(row.status)}</Badge>
                        <span className="text-base font-black text-slate-950">
                          {formatCompactNumber(row._count.status)}
                        </span>
                      </div>
                    ))}

                    {reportStats.statusGroups.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-500">
                        ยังไม่มีข้อมูลสถานะการจอง
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
