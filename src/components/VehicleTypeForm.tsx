'use client'

import { useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button, Input, Label, Textarea } from '@/components/ui'
import { createVehicleType } from '@/app/(dashboard)/cars/vehicle-type-actions'
import { useRouter } from 'next/navigation'

interface VehicleTypeFormProps {
  onSuccess: () => void
}

export default function VehicleTypeForm({ onSuccess }: VehicleTypeFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    remark: '',
  })
  const router = useRouter()

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
    if (!formData.name.trim()) newErrors.name = 'ชื่อประเภทรถเป็นข้อมูลบังคับ'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const result = await createVehicleType({
        name: formData.name.trim(),
        description: formData.description || null,
        remark: formData.remark || null,
      })

      if (result.success) {
        onSuccess()

        router.refresh()
      } else {
        setErrors({ form: result.error || 'เกิดข้อผิดพลาดในการสร้างประเภทรถ' })
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
          ข้อมูลประเภทรถ
        </h3>

        <div>
          <Label htmlFor="name" className="font-bold text-slate-900">
            ชื่อประเภทรถ <span className="text-red-600">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="เช่น SUV, Sedan, Pickup"
            value={formData.name}
            onChange={handleChange}
            className="mt-2"
          />
          {errors.name && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description" className="font-bold text-slate-900">
            รายละเอียด
          </Label>
          <Textarea
            id="description"
            name="description"
            placeholder="เพิ่มรายละเอียดเกี่ยวกับประเภทรถนี้..."
            value={formData.description}
            onChange={handleChange}
            className="mt-2 resize-none"
            rows={3}
          />
          {errors.description && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <Label htmlFor="remark" className="font-bold text-slate-900">
            หมายเหตุ
          </Label>
          <Textarea
            id="remark"
            name="remark"
            placeholder="หมายเหตุเพิ่มเติม เช่น เงื่อนไขการใช้งาน..."
            value={formData.remark}
            onChange={handleChange}
            className="mt-2 resize-none"
            rows={3}
          />
          {errors.remark && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.remark}</p>
          )}
        </div>
      </section>

      <div className="sticky bottom-0 left-0 right-0 border-t border-slate-200 bg-white pt-4">
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
            variant={"save"}
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
