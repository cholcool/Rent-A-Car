// import { DashboardHeaderPage } from './header'
import { OverviewPage } from './overview'
// import { StatisticsPage } from './statistics'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export type TabKey = 'overview' | 'reports'

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
