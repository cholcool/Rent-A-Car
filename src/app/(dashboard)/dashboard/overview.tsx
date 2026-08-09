import Link from 'next/link'
import {
  Car,
  Users,
  ClipboardList,
  Tag,
  LucideIcon
} from 'lucide-react'
import prisma from '@/lib/prisma'
import {
  formatCompactNumber,
} from '@/lib/ui-format'
import { Card, CardContent } from '@/components/ui'
import { cn } from '@/lib/utils'
import { TabKey } from './page'

type StatCardProps = {
  href?: string
  title: string
  value: string
  unit: string
  icon: LucideIcon
  iconClassName: string
  valueClassName?: string
}

export function StatCard({ href = '/dashboard', title, value, unit, icon: Icon, iconClassName, valueClassName = 'text-slate-950' }: StatCardProps) {
  return (
    <Link href={href}>
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
    </Link>
  )
}

export async function OverviewPage({ activeTab }: { activeTab: TabKey }) {
  const overviewPromise = activeTab === 'overview'
    ? Promise.all([
        prisma.car.count({ where: { isDeleted: false } }),
        prisma.driver.count({ where: { isDeleted: false } }),
        prisma.product.count({ where: { isDeleted: false } }),
        prisma.booking.count({ where: { isDeleted: false } }),
      ])
    : null

  const [overviewData] = await Promise.all([overviewPromise])

  const overviewStats = overviewData
    ? {
        totalCars: overviewData[0],
        totalDriver: overviewData[1],
        totalProduct: overviewData[2],
        totalBooking: overviewData[3],
      }
    : null

  return (
    <>
      {activeTab === 'overview' && overviewStats && (
        <>
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              href='/cars'
              title="รถทั้งหมด"
              value={formatCompactNumber(overviewStats.totalCars)}
              unit=""
              icon={Car}
              iconClassName="h-5 w-5 text-slate-400"
            />
            <StatCard
              href='/driver'
              title="ลูกค้าทั้งหมด"
              value={formatCompactNumber(overviewStats.totalDriver)}
              unit=""
              icon={Users}
              iconClassName="h-6 w-6 text-emerald-500"
              valueClassName="text-emerald-600"
            />
            <StatCard
              href='/products'
              title="บริการทั้งหมด"
              value={formatCompactNumber(overviewStats.totalProduct)}
              unit=""
              icon={Tag}
              iconClassName="h-6 w-6 text-[#6F3BB7]"
              valueClassName="text-[#4E2788]"
            />
            <StatCard
              href='/bookings'
              title="รายการทั้งหมด"
              value={formatCompactNumber(overviewStats.totalBooking)}
              unit=""
              icon={ClipboardList}
              iconClassName="h-6 w-6 text-emerald-600"
              valueClassName="text-emerald-700"
            />
          </section>
        </>
      )}
    </>
  )
}