import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-10 w-56 rounded-2xl" />
          <Skeleton className="h-5 w-80 rounded-xl" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:min-w-72">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 lg:grid-cols-3 xl:grid-cols-[minmax(220px,1fr)_180px_160px_160px_150px_auto]">
        <Skeleton className="h-11 rounded-xl" />
        <Skeleton className="h-11 rounded-xl" />
        <Skeleton className="h-11 rounded-xl" />
        <Skeleton className="h-11 rounded-xl" />
        <Skeleton className="h-11 rounded-xl" />
        <Skeleton className="h-11 rounded-xl" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-7 w-40 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>

        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-4 lg:grid-cols-6">
              <Skeleton className="h-5 rounded-lg" />
              <Skeleton className="h-5 rounded-lg" />
              <Skeleton className="h-5 rounded-lg" />
              <Skeleton className="h-5 rounded-lg" />
              <Skeleton className="h-5 rounded-lg" />
              <Skeleton className="h-5 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
