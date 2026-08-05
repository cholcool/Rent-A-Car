'use client'

import { useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button, Label, Input, Textarea } from '@/components/ui'
import { createCar } from '@/app/(dashboard)/cars/cars-actions'
import { useRouter } from 'next/navigation'
import { CarStatusOptions, CarStatus } from '@/lib/types'
import CarImageUploader from '@/components/CarImageUploader'

interface VehicleType {
  id: string
  name: string
}

interface Brand {
  id: string
  name: string
}

interface CarFormProps {
  vehicleTypes: VehicleType[]
  brands: Brand[]
  onSuccess: () => void
}

export default function CarForm({ vehicleTypes, brands, onSuccess }: CarFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [formData, setFormData] = useState({
    vehicleTypeId: '',
    brandId: '',
    model: '',
    year: new Date().getFullYear().toString(),
    color: '',
    license: '',
    engine: '',
    chassis: '',
    mileage: '0',
    status: 'Available',
    remark: '',
  })
  const router = useRouter()

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    if (!formData.vehicleTypeId) newErrors.vehicleTypeId = 'ประเภทรถเป็นข้อมูลบังคับ'
    if (!formData.brandId) newErrors.brandId = 'แบรนด์รถเป็นข้อมูลบังคับ'
    if (!formData.model.trim()) newErrors.model = 'รุ่นรถเป็นข้อมูลบังคับ'
    if (!formData.year || !/^\d{4}$/.test(formData.year)) newErrors.year = 'ปีต้องเป็นตัวเลข 4 หลัก'
    if (!formData.color.trim()) newErrors.color = 'สีรถเป็นข้อมูลบังคับ'
    if (!formData.license.trim()) newErrors.license = 'ทะเบียนรถเป็นข้อมูลบังคับ'
    const mileageNum = parseFloat(formData.mileage)
    if (isNaN(mileageNum) || mileageNum < 0) newErrors.mileage = 'เลขไมล์ต้องเป็นตัวเลขและไม่เป็นลบ'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const result = await createCar({
        vehicleTypeId: formData.vehicleTypeId,
        brandId: formData.brandId,
        model: formData.model.trim(),
        year: formData.year,
        color: formData.color,
        license: formData.license.trim(),
        engine: formData.engine || null,
        chassis: formData.chassis || null,
        mileage: parseFloat(formData.mileage),
        status: formData.status as CarStatus,
        remark: formData.remark || null,
      })

      if (result.success) {
        const carId = result.data?.id
        if (carId && pendingFiles.length > 0) {
          const formData = new FormData()
          formData.append('carId', carId)
          pendingFiles.forEach((file) => formData.append('files', file))
          await fetch('/api/car-images', { method: 'POST', body: formData })
        }
        router.refresh()

        setTimeout(() => {
          onSuccess() 
        }, 60)
      } else {
        setErrors({ form: result.error || 'เกิดข้อผิดพลาดในการสร้างรถ' })
      }
    } catch {
      setErrors({ form: 'เกิดข้อผิดพลาด กรุณาลองใหม่' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      {errors.form && (
        <div className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">
          {errors.form}
        </div>
      )}

      <section className="space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
        ข้อมูลรถ
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="vehicleTypeId" className="font-bold text-slate-900">
              ประเภทรถ <span className="text-red-600">*</span>
            </Label>
            <select
              id="vehicleTypeId"
              name="vehicleTypeId"
              value={formData.vehicleTypeId}
              onChange={handleChange}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">-- เลือกประเภทรถ --</option>
              {vehicleTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.vehicleTypeId && (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.vehicleTypeId}</p>
            )}
          </div>

          <div>
            <Label htmlFor="brandId" className="font-bold text-slate-900">
              แบรนด์รถ <span className="text-red-600">*</span>
            </Label>
            <select
              id="brandId"
              name="brandId"
              value={formData.brandId}
              onChange={handleChange}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">-- เลือกแบรนด์ --</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            {errors.brandId && (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.brandId}</p>
            )}
          </div>
        </div>
        
        <div>
          <Label htmlFor="model" className="font-bold text-slate-900">
            รุ่นรถ <span className="text-red-600">*</span>
          </Label>
          <Input
            id="model"
            name="model"
            type="text"
            placeholder="เช่น Accord, Civic, CR-V, HR-V, Camry, Corolla"
            value={formData.model}
            onChange={handleChange}
            className="mt-2"
          />
          {errors.model && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.model}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="year" className="font-bold text-slate-900">
              ปีที่ผลิต <span className="text-red-600">*</span>
            </Label>
            <Input
              id="year"
              name="year"
              type="text"
              placeholder="2024"
              inputMode="numeric"
              maxLength={4}
              value={formData.year}
              onChange={handleChange}
              className="mt-2"
            />
            {errors.year && (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.year}</p>
            )}
          </div>

          <div>
            <Label htmlFor="color" className="font-bold text-slate-900">
              สีรถ <span className="text-red-600">*</span>
            </Label>
            <Input
              id="color"
              name="color"
              type="text"
              placeholder="เช่น สีดำ, สีขาว"
              value={formData.color}
              onChange={handleChange}
              className="mt-2"
            />
            {errors.color && (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.color}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="license" className="font-bold text-slate-900">
              ทะเบียนรถ <span className="text-red-600">*</span>
            </Label>
            <Input
              id="license"
              name="license"
              type="text"
              placeholder="เช่น กก-1234"
              value={formData.license}
              onChange={handleChange}
              className="mt-2"
            />
            {errors.license && (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.license}</p>
            )}
          </div>

          <div>
            <Label htmlFor="engine" className="font-bold text-slate-900">
              เลขเครื่องยนต์
            </Label>
            <Input
              id="engine"
              name="engine"
              type="text"
              placeholder="เช่น R20A1 - 1234567"
              value={formData.engine}
              onChange={handleChange}
              className="mt-2"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="chassis" className="font-bold text-slate-900">
              เลขตัวถัง 
            </Label>
            <Input
              id="chassis"
              name="chassis"
              type="text"
              placeholder="เช่น MRHFC26A0E0123456"
              value={formData.chassis}
              onChange={handleChange}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="mileage" className="font-bold text-slate-900">
              เลขไมล์
            </Label>
            <Input
              id="mileage"
              name="mileage"
              type="number"
              placeholder="0"
              min="0"
              value={formData.mileage}
              onChange={handleChange}
              className="mt-2"
            />
            {errors.mileage && (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.mileage}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="status" className="font-bold text-slate-900">
            สถานะรถ
          </Label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {CarStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <Label htmlFor="remark" className="font-bold text-slate-900">
          หมายเหตุ
          </Label>
          <Textarea
            id="remark"
            name="remark"
            placeholder="เพิ่มหมายเหตุเกี่ยวกับรถคันนี้..."
            value={formData.remark}
            onChange={handleChange}
            className="mt-2 resize-none"
            rows={3}
          />
        </div>

      </section>

      <CarImageUploader onPendingFilesChange={setPendingFiles} />

      <div className="sticky bottom-0 left-0 right-0 border-t border-slate-200 bg-white pt-4">
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
            variant="save"
          >
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </Button>
        </div>
      </div>
    </form>
  )
}
