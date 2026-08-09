
import {
  LayoutGrid,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TabKey } from './page'

export function DashboardHeaderPage({ activeTab }: { activeTab: TabKey }) {

  const tabLinkClass = (tab: TabKey) =>
    cn(
      'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
      activeTab === tab
        ? 'bg-white text-slate-950 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200'
        : 'text-slate-500 hover:bg-white/60 hover:text-slate-950'
    )
    
  return (
    <header className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-200/70 backdrop-blur sm:p-8">
      <nav className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
        <a href="?tab=overview" className={tabLinkClass('overview')}>
          <LayoutGrid className="h-4 w-4" />
          Dashboard
        </a>
        <a href="?tab=reports" className={tabLinkClass('reports')}>
          <TrendingUp className="h-4 w-4" />
          สถิติ
        </a>
      </nav>
    </header>
  )
}