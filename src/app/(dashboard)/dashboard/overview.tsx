
import {
  Car,
  Users,
  ClipboardList,
  Tag,
} from 'lucide-react'
import prisma from '@/lib/prisma'
import {
  formatCompactNumber,
} from '@/lib/ui-format'
import { TabKey, StatCard } from './page'

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