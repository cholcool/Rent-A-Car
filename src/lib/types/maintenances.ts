export type MaintenanceType = 'Maintenance' | 'Tax' | 'Insurance'

export const MaintenanceType = [
  { value: 'Maintenance', label: 'บำรุงรักษา' },
  { value: 'Tax', label: 'ภาษี' },
  { value: 'Insurance', label: 'ประกันภัย' },
] as const

export type MaintenanceStatus = 'Pending' | 'Active' | 'Complete' | 'Overdue'

export const MaintenanceStatus = [
  { value: 'Pending', label: 'รอแจ้งเตือน' },
  { value: 'Active', label: 'แจ้งเตือน' },
  { value: 'Complete', label: 'เสร็จสิ้น' },
  { value: 'Overdue', label: 'เกินกำหนด' },
] as const

export type MaintenanceRow = {
  id: string
  type: MaintenanceType | null
  name: string | null
  description: string | null
  remark: string | null
  status: MaintenanceStatus
  mileage: number | null
  mileageTarget: number | null
  mileageAlert: number | null
  dateAlert: string | null
  dateStart: string | null
  dateEnd: string | null
  dateCount: number | null
}

export type  MaintenanceProps = {
  carId?: string
  carMileage?: number
  carOptions?: Array<{ id: string; label: string }>
  maintenances: MaintenanceRow[]
  variant?: 'page' | 'modal'
  showList?: boolean
  onClose?: () => void
}

export function getMaintenanceStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    Active: "แจ้งเตือน",
    Complete: "เสร็จสิ้น",
    Pending: "รอแจ้งเตือน",
    Overdue: "เกินกำหนด",
  };

  return status ? labels[status] ?? status : "Unknown";
}