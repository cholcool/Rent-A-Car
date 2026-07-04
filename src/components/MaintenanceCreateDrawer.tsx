'use client'

import { useMemo, useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, Wrench, Settings2, X } from 'lucide-react'
import { Button, Card, CardContent, Input, Textarea, Select, Badge } from '@/components/ui'
import { formatThaiDate, formatCompactNumber, toNumber, getStatusLabel } from '@/lib/ui-format'
import { createMaintenance, deleteMaintenance, updateMaintenance } from '@/app/(dashboard)/cars/maintenance-actions'
import { AlertDialogDestructive } from '@/components/AlertDialogDestructive'
import { MaintenanceStatus, MaintenanceProps, MaintenanceRow, MaintenanceType, getMaintenanceStatusLabel } from '@/lib/types'

// const todayStr = new Date().toISOString().split('T')[0];

function statusClass(status: MaintenanceStatus) {
  if (status === 'Active') return 'bg-blue-100 text-blue-700'
  if (status === 'Complete') return 'bg-emerald-100 text-emerald-700'
  return 'bg-amber-100 text-amber-700'
}

export default function MaintenanceCreateDrawer({
  carId,
  carMileage,
  carOptions = [],
  maintenances,
  variant = 'page',
  showList = true,
  onClose,
}: MaintenanceProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(variant === 'modal')
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectCarMileage, setSelectCarMileage] = useState(carMileage ?? 0)
  const [selectedCarId, setSelectedCarId] = useState(carId ?? '')
  const emptyForm = {
    maintenanceId: '',
    type: 'Maintenance' as MaintenanceType,
    name: '',
    description: '',
    remark: '',
    status: 'Pending' as MaintenanceStatus,
    mileage: String(selectCarMileage ?? 0),
    mileageTarget: '0',
    mileageAlert: '0',
    dateAlert: '',
    dateStart: '',
    dateEnd: '',
    dateCount: 0,
  }
  const [formData, setFormData] = useState(emptyForm)

  const isEdit = Boolean(formData.maintenanceId)

  const title = useMemo(() => (isEdit ? 'แก้ไขการบำรุงรักษา' : 'เพิ่มการบำรุงรักษา'), [isEdit])

  const openCreate = () => {
    handleClose(true)
  }
  
  function calculateDateStatus(startStr: string, endStr: string): MaintenanceStatus {
    if (!startStr) return 'Pending';
  
    const today = new Date();
    today.setHours(0, 0, 0, 0); // ตั้งค่าเวลาเป็น 00:00 เพื่อเช็กเฉพาะวันที่
  
    const startDate = new Date(startStr);
    startDate.setHours(0, 0, 0, 0);
  
    if (endStr) {
      const endDate = new Date(endStr);
      endDate.setHours(0, 0, 0, 0);
  
      if (today >= endDate) {
        return 'Complete';
      }
    }
  
    if (today >= startDate) {
      return 'Active';
    }
  
    return 'Pending';
  }  

  function calculateDateCount(startStr: string, endStr: string): number {
    if (!startStr || !endStr) return 0;
  
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
  
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      const timeDiff = endDate.getTime() - startDate.getTime();
      const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      return dayDiff >= 0 ? dayDiff : 0;
    }
    
    return 0;
  };
  
  const formatDateString = (dateInput: any) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };
  
  const openEdit = (row: MaintenanceRow) => {
    const formattedStart = formatDateString(row.dateStart);
    const formattedEnd = formatDateString(row.dateEnd);

    setFormData({
      maintenanceId: row.id,
      type: row.type ?? 'Maintenance',
      name: row.name ?? '',
      description: row.description ?? '',
      remark: row.remark ?? '',
      status: row.status ?? 'Pending',
      mileage: String(row.mileage ?? 0),
      mileageTarget: String(row.mileageTarget ?? 0),
      mileageAlert: String(row.mileageAlert ?? 0),
      dateAlert: row.dateAlert ?? '',
      dateStart: formattedStart,
      dateEnd: formattedEnd,
      dateCount: Number(calculateDateCount(formattedStart, formattedEnd) ?? 0),
    })
    setSelectedCarId(carId ?? '')
    setSelectCarMileage(carMileage ?? 0)
    setIsOpen(true)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    
    setFormData((prev) => {
      const updatedForm = { ...prev, [name]: value };

      if (name === 'dateStart') {
        updatedForm.status = calculateDateStatus(updatedForm.dateStart, updatedForm.dateEnd);
      }
  
      if (name === 'dateStart' || name === 'dateEnd') {
        updatedForm.dateCount = calculateDateCount(updatedForm.dateStart, updatedForm.dateEnd);
      }
  
      return updatedForm;
    });

    setErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!formData.type) next.type = 'ประเภทงานเป็นข้อมูลบังคับ'
    if (!formData.name.trim()) next.name = 'ชื่อรายการเป็นข้อมูลบังคับ'
    if (!formData.status) next.status = 'สถานะเป็นข้อมูลบังคับ'
    // if (!formData.dateStart) next.dateStart = 'วันที่เริ่มต้นเป็นข้อมูลบังคับ'
    // if (!formData.dateEnd) next.dateEnd = 'วันที่สิ้นสุดเป็นข้อมูลบังคับ'
    return next
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const nextErrors = validate()

    if (variant === 'modal' && !selectedCarId) nextErrors.carId = 'กรุณาเลือกรถ'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    startTransition(async () => {
      const formattedStart = formatDateString(formData.dateStart);
      const formattedEnd = formatDateString(formData.dateEnd);
      const payload = {
        carId: selectedCarId || carId || '',
        maintenanceId: formData.maintenanceId || undefined,
        type: formData.type,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        remark: formData.remark.trim() || null,
        status: calculateDateStatus(formattedStart, formattedEnd),
        mileage: Number(formData.mileage || 0),
        mileageTarget: Number(formData.mileageTarget || 0),
        mileageAlert: Number(formData.mileageAlert || 0),
        dateAlert: formData.dateAlert || null,
        dateStart: formattedStart,
        dateEnd: formattedEnd,
        dateCount: Number(calculateDateCount(formattedStart, formattedEnd) || 0),
      }

      const result = formData.maintenanceId
        ? await updateMaintenance(payload)
        : await createMaintenance(payload)

      if (!result.success) {
        setErrors({ form: result.error || 'บันทึกข้อมูลไม่สำเร็จ' })
        return
      }

      handleClose(false)
      router.refresh()
    })
  }

  const handleDelete = (maintenanceId: string) => {
    startTransition(async () => {
      const result = await deleteMaintenance(maintenanceId)
      if (!result.success) {
        setErrors({ form: result.error || 'ลบข้อมูลไม่สำเร็จ' })
        return
      }
      router.refresh()
    })
  }

  const handleClose = (force: boolean) => {
    setIsOpen(force)
    setFormData(emptyForm)
    setErrors({})
    onClose?.()
  }
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <>
      {showList ? (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-blue-700" />
                <h2 className="text-lg font-bold text-slate-950">ประวัติการบำรุงรักษา</h2>
              </div>
              <Button type="button" onClick={openCreate} className="flex items-center gap-1">
                <Wrench className="h-4 w-4" />
                เพิ่มการบำรุงรักษา
              </Button>
            </div>

            <div className="overflow-auto rounded-xl border border-slate-200">
              <table className="w-full table-fixed ">
                <thead className="bg-slate-50">
                  <tr className="text-left text-sm font-semibold text-slate-600">
                    <th className="w-30 px-4 py-3">สถานะ</th>
                    <th className="w-45 px-4 py-3">ประเภทการบำรุงรักษา</th>
                    <th className="w-45 px-4 py-3">รายละเอียด</th>
                    <th className="w-60 px-4 py-3">วันที่แจ้งเตือน</th>
                    <th className="w-50 px-4 py-3">กำหนดเช็กระยะที่เลขไมล์</th>
                    <th className="w-45 px-4 py-3">แจ้งเตือนเลขไมล์ล่วงหน้า</th>
                    <th className="w-35 px-4 py-3">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {maintenances.length > 0 ? (
                    maintenances.map((row) => (
                      <tr key={row.id} className="align-top text-sm text-slate-700">
                        <td className="px-4 py-3">
                          <Badge className={statusClass(row.status)}>{MaintenanceStatus.find(status => status.value === row.status)?.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{getStatusLabel(row.type) ?? '-'}</div>
                          <div className="text-xs text-slate-500">{row.name ?? '-'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className='overflow-hidden text-nowrap'>{row.description ?? '-'}</div>
                        </td>
                        <td className="px-4 py-3">{row.dateStart ? `${formatThaiDate(row.dateStart)} ถึง ${formatThaiDate(row.dateEnd)}` : '-'}</td>
                        <td className="px-4 py-3">{formatCompactNumber(toNumber(row.mileageTarget))}</td>
                        <td className="px-4 py-3">{formatCompactNumber(toNumber(row.mileageAlert))}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button type="button" size="icon-sm" variant="outline" onClick={() => openEdit(row)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialogDestructive onClick={() => handleDelete(row.id)} />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                        ไม่มีประวัติการบำรุงรักษา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 my-0">
          <button type="button" className="absolute inset-0 bg-slate-950/30 my-0" onClick={() => handleClose(false)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-950">{title}</h3>
                <p className="mt-1 text-sm text-slate-500">การแจ้งเตือนจะเลียงลำดับจากวันที่แจ้งเตือนขึ้นก่อนเลขไมล์</p>
              </div>
              <button type="button" onClick={() => handleClose(false)} className="rounded-full border border-slate-200 p-2">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {errors.form ? (
                <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">{errors.form}</div>
              ) : null}
              
              {variant === 'modal' ? (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">เลือกรถ <span className="text-red-600">*</span></label>
                  <Select value={selectedCarId} onChange={(e) => setSelectedCarId(e.target.value)}>
                    <option value="">-- เลือกรถ --</option>
                    {carOptions.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.label}
                      </option>
                    ))}
                  </Select>
                  {errors.carId ? <p className="text-xs text-red-600">{errors.carId}</p> : null}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">ประเภทงาน <span className="text-red-600">*</span></label>
                  <Select name="type" value={formData.type} onChange={handleChange}>
                    {MaintenanceType.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                  {errors.type ? <p className="text-xs text-red-600">{errors.type}</p> : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">สถานะ <span className="text-red-600">*</span></label>
                  <Input name="status" value={getMaintenanceStatusLabel(formData.status)} readOnly />
                  {errors.status ? <p className="text-xs text-red-600">{errors.status}</p> : null}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">ชื่อรายการ <span className="text-red-600">*</span></label>
                <Input name="name" value={formData.name} onChange={handleChange} maxLength={255} />
                {errors.name ? <p className="text-xs text-red-600">{errors.name}</p> : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">รายละเอียด</label>
                <Input name="description" value={formData.description} onChange={handleChange} maxLength={255} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">หมายเหตุ</label>
                <Textarea name="remark" value={formData.remark} onChange={handleChange} maxLength={500} rows={3} />
              </div>

              <br />
              <b>การแจ้งเตือนด้วยวันที่</b>
              <hr />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 hidden">
                  <label className="text-sm font-semibold text-slate-700">วันที่แจ้งเตือน</label>
                  <Input name="dateAlert" type="date" value={formData.dateAlert} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">วันที่เริ่มต้นแจ้งเตือน</label>
                  <Input name="dateStart" type="date" value={formData.dateStart} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">วันที่สิ้นสุดแจ้งเตือน</label>
                  <Input name="dateEnd" type="date" value={formData.dateEnd} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-2 hidden">
                <label className="text-sm font-semibold text-slate-700">จำนวนวันที่แจ้งเตือน</label>
                <Input name="dateCount" type="number" min="0" value={formData.dateCount} onChange={handleChange} readOnly />
              </div>

              <br />
              <b>การแจ้งเตือนด้วยเลขไมล์</b>
              <hr />

              <div className='rounded-2xl border border-slate-200 p-4'>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-500">
                    <div className="font-bold text-slate-950">เลขไมล์ล่าสุดของรถ</div>
                    <div>{formatCompactNumber(toNumber(formData.mileage))}</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">กำหนดเช็กระยะที่เลขไมล์</label>
                  <Input name="mileageTarget" type="number" step="0" value={formData.mileageTarget} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">แจ้งเตือนเลขไมล์ล่วงหน้า</label>
                  <Input name="mileageAlert" type="number" step="0" value={formData.mileageAlert} onChange={handleChange} />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="save" className="flex-1" disabled={isPending}>
                  บันทึก
                </Button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  )
}
