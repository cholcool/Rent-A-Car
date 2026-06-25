'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
import Textarea from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { 
  DriverFormState, 
  DriverRow, 
  DriverEmptyForm, 
  GuarantorFormState,
  GuarantorEmptyForm
} from '@/lib/types'

interface DriverDrawerProps {
  initialDrivers: DriverRow[]
  formIn?: DriverFormState
  formGuarantorIn?: GuarantorFormState
  errorIn?: string
  editingId?: string | null
  licenseFile?: File | null
  setLicenseFile?: (file: File | null) => void 
  cardFile?: File | null
  setCardFile?: (file: File | null) => void 
  setDrawerOpen?: (open: boolean) => void
  setDrivers: React.Dispatch<React.SetStateAction<DriverRow[]>>
}

export default function DriverDrawer({
  initialDrivers,
  formIn,
  formGuarantorIn,
  errorIn,
  editingId,
  setDrawerOpen,
  setDrivers,
} : DriverDrawerProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(errorIn)
  const [form, setForm] = useState(formIn || DriverEmptyForm)
  const [formGuarantor, setFormGuarantor] = useState<GuarantorFormState>(formGuarantorIn || GuarantorEmptyForm)
  const router = useRouter()
  
  const editingDriver = useMemo(
    () => initialDrivers.find((driver) => driver.id === editingId) ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editingId]
  )
  

  function closeDrawer() {
    if (saving) return
    setDrawerOpen?.(false)
  }

  function formatePhoneNumber(value: string) {
    const digits = value.replace(/\D/g, '')
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
    }
    return digits
  }

  function updateField<K extends keyof DriverFormState>(key: K, value: DriverFormState[K]) {
    if (key === 'phone') {
      value = formatePhoneNumber(value as string) as DriverFormState[K]
    }

    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateFieldGuarantor<K extends keyof GuarantorFormState>(key: K, value: GuarantorFormState[K]) {
    if (key === 'phone') {
      value = formatePhoneNumber(value as string) as GuarantorFormState[K]
    }

    setFormGuarantor((current) => ({ ...current, [key]: value }))
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!form.fullName.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุลคนขับ')
      return
    }
    if (!form.phone.trim()) {
      setError('กรุณากรอกเบอร์โทรศัพท์')
      return
    }

    const guarantorProvided = [
      formGuarantor.fullName.trim(),
      formGuarantor.phone.trim(),
      formGuarantor.remark?.trim(),
      formGuarantor.cardImageId,
      formGuarantor.licenseImageId,
    ].some(Boolean)

    if (guarantorProvided) {
      if (!formGuarantor.fullName.trim()) {
        setError('กรุณากรอกชื่อ-นามสกุลผู้ค้ำ')
        return
      }
      if (!formGuarantor.phone.trim()) {
        setError('กรุณากรอกเบอร์โทรศัพท์ผู้ค้ำ')
        return
      }
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        guarantor: guarantorProvided
          ? {
              ...formGuarantor,
              remark: formGuarantor.remark?.trim() || null,
            }
          : null,
      }

      const res = await fetch('/api/drivers', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'ไม่สามารถบันทึกข้อมูลได้')
        return
      }

      const row: DriverRow = data.driver
      setDrivers((current) => (editingId ? current.map((item) => (item.id === row.id ? row : item)) : [row, ...current]))
      router.refresh()
      setDrawerOpen?.(false)
    } catch {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button type="button" aria-label="Close drawer" className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[2px] my-0" onClick={closeDrawer} />

      <aside className="fixed right-0 top-0 z-40 h-full w-full max-w-2xl overflow-auto bg-white shadow-2xl">
        <Card className="h-full rounded-none border-0">
          <CardContent className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-950">{editingDriver ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มข้อมูลลูกค้าใหม่'}</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">กรอกข้อมูลพื้นฐานและอัปโหลดเอกสาร</p>
              </div>
              <button type="button" onClick={closeDrawer} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="mt-6 flex-1 space-y-6 overflow-auto pr-1" onSubmit={submitForm}>
              <div className='space-y-6'>
                <h3 className='text-xl font-extrabold text-slate-950'>ผู้เช่า</h3>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label htmlFor="fullName">ชื่อ-นามสกุล</Label>
                    <Input id="fullName" maxLength={150} value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} required />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="phone">เบอร์โทรศัพท์ </Label>
                    <Input id="phone" maxLength={10} minLength={10} value={form.phone} onChange={(e) => updateField('phone', e.target.value)} required />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="remark">หมายเหตุ</Label>
                    <Textarea id="remark" maxLength={500} value={form.remark ?? ''} onChange={(e) => updateField('remark', e.target.value)} />
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-950 cardImageId">รูปบัตรประชาชน</div>
                      </div>
                      {form.cardImageId ? <Badge variant="success">อัปโหลดแล้ว</Badge> : <Badge variant="destructive">ยังไม่มี</Badge>}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-950 licenseImageId">รูปใบขับขี่</div>
                      </div>
                      {form.licenseImageId ? <Badge variant="success">อัปโหลดแล้ว</Badge> : <Badge variant="destructive">ยังไม่มี</Badge>}
                    </div>
                  </div>
                </div>
              </div>

              <div className='space-y-6 border-t border-slate-200 pt-5'>
                <h3 className='text-xl font-extrabold text-slate-950'>ผู้ค้ำ</h3>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label htmlFor="fullNameGua">ชื่อ-นามสกุล</Label>
                    <Input id="fullNameGua" maxLength={150} value={formGuarantor.fullName} onChange={(e) => updateFieldGuarantor('fullName', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="phoneGua">เบอร์โทรศัพท์</Label>
                    <Input id="phoneGua" maxLength={10} minLength={10} value={formGuarantor.phone} onChange={(e) => updateFieldGuarantor('phone', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="remarkGua">หมายเหตุ</Label>
                    <Textarea id="remarkGua" maxLength={500} value={formGuarantor.remark ?? ''} onChange={(e) => updateFieldGuarantor('remark', e.target.value)} />
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-950">รูปบัตรประชาชน</div>
                      </div>
                      {formGuarantor.cardImageId ? <Badge variant="success">อัปโหลดแล้ว</Badge> : <Badge variant="destructive">ยังไม่มี</Badge>}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-950">รูปใบขับขี่</div>
                      </div>
                      {formGuarantor.licenseImageId ? <Badge variant="success">อัปโหลดแล้ว</Badge> : <Badge variant="destructive">ยังไม่มี</Badge>}
                    </div>
                  </div>
                </div>
              </div>
              
              {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
                <Button type="submit" disabled={saving} className="gap-2 w-full" variant="save">
                  {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </aside>
    </>
  )
}
