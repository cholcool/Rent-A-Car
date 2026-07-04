import type { MaintenanceStatus, MaintenanceRow } from '@/lib/types'

type MaintenanceSortableRow = Omit<
  Pick<MaintenanceRow, 'status' | 'dateStart' | 'dateEnd' | 'dateCount' | 'mileageAlert' | 'mileageTarget'>,
  'dateStart' | 'dateEnd' | 'mileageAlert' | 'mileageTarget'
> & {
  dateStart?: string | Date | null
  dateEnd?: string | Date | null
  mileageAlert?: number | null
  mileageTarget?: number | null
}


type MaintenanceStateInput = {
  status?: MaintenanceStatus | null
  dateStart?: string | Date | null
  dateEnd?: string | Date | null
  mileage?: number | null
  mileageAlert?: number | null
  mileageTarget?: number | null
  currentMileage?: number | null
  now?: Date
}

function toDate(value?: string | Date | null) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function compareStatus(a: MaintenanceStatus, b: MaintenanceStatus) {
  const priority: Record<MaintenanceStatus, number> = {
    Overdue: 3,
    Active: 2,
    Pending: 1,
    Complete: 0,
  }
  return priority[a] - priority[b]
}

function hasDateRule(input: MaintenanceStateInput) {
  return Boolean(input.dateStart || input.dateEnd)
}

function hasMileageRule(input: MaintenanceStateInput) {
  return input.mileageAlert != null && input.mileageTarget != null
}

export function resolveMaintenanceStatus(input: MaintenanceStateInput): MaintenanceStatus {
  if (input.status === 'Complete') return 'Complete'

  const now = input.now ?? new Date()
  now.setHours(0, 0, 0, 0)

  const start = toDate(input.dateStart)
  const end = toDate(input.dateEnd)
  if (start) start.setHours(0, 0, 0, 0)
  if (end) end.setHours(0, 0, 0, 0)

  const currentMileage = Math.max(0, Math.floor(input.currentMileage ?? input.mileage ?? 0))
  const mileageAlert = Math.max(0, Math.floor(input.mileageAlert ?? 0))
  const mileageTarget = Math.max(0, Math.floor(input.mileageTarget ?? 0))

  const dateStatus: MaintenanceStatus =
    start && end && now > end ? 'Overdue' : start && now >= start ? 'Active' : 'Pending'

  const mileageStatus: MaintenanceStatus =
    currentMileage > mileageTarget && mileageTarget > 0
      ? 'Overdue'
      : currentMileage >= mileageAlert && mileageAlert > 0
        ? 'Active'
        : 'Pending'

  const hasDate = hasDateRule(input)
  const hasMileage = hasMileageRule(input)

  if (hasDate && hasMileage) return compareStatus(dateStatus, mileageStatus) >= 0 ? dateStatus : mileageStatus
  if (hasDate) return dateStatus
  if (hasMileage) return mileageStatus
  return input.status ?? 'Pending'
}

export function sortMaintenancesForAlert(a: MaintenanceSortableRow, b: MaintenanceSortableRow) {
  const statusPriority: Record<MaintenanceStatus, number> = {
    Overdue: 0,
    Active: 1,
    Pending: 2,
    Complete: 3,
  }

  const triggerPriority = (item: MaintenanceSortableRow) => {
    const hasDate = Boolean(item.dateStart || item.dateEnd)
    const hasMileage = item.mileageAlert != null && item.mileageTarget != null
    if (hasDate && hasMileage) return 0
    if (hasDate) return 1
    if (hasMileage) return 2
    return 3
  }

  const statusDiff = statusPriority[a.status] - statusPriority[b.status]
  if (statusDiff !== 0) return statusDiff

  const triggerDiff = triggerPriority(a) - triggerPriority(b)
  if (triggerDiff !== 0) return triggerDiff

  const dateDiff = (a.dateStart ? new Date(a.dateStart).getTime() : 0) - (b.dateStart ? new Date(b.dateStart).getTime() : 0)
  if (dateDiff !== 0) return dateDiff

  return (b.dateCount ?? 0) - (a.dateCount ?? 0)
}
