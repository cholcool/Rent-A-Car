import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import Link from 'next/link'
// import { DashboardHeaderPage } from './header'
import { OverviewPage } from './overview'
// import { StatisticsPage } from './statistics'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export type TabKey = 'overview' | 'reports'

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

function getTabValue(params: Record<string, string | string[] | undefined>): TabKey {
  const tab = typeof params.tab === 'string' ? params.tab : 'overview'
  return tab === 'reports' ? 'reports' : 'overview'
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const activeTab = getTabValue(params)



  return (
    <div className="space-y-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-linear-to-b from-[#F4E7B0]/80 via-slate-50 to-transparent" />

      {/* <DashboardHeaderPage activeTab={activeTab} /> */}

      <OverviewPage activeTab={activeTab} />

      {/* <StatisticsPage activeTab={activeTab} /> */}

    </div>
  )
}
