'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
import Textarea from '@/components/ui/textarea'
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { useRouter } from 'next/navigation'
import { DriverFormState, DriverRow, UploadedImage, DriverEmptyForm, ImageType } from '@/lib/types'

interface DriverDrawerProps {
  initialDrivers: DriverRow[]
  formIn?: DriverFormState
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
  errorIn,
  editingId,
  licenseFile,
  setLicenseFile,
  cardFile,
  setCardFile,
  setDrawerOpen,
  setDrivers,
} : DriverDrawerProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(errorIn)
  const [form, setForm] = useState(formIn || DriverEmptyForm)
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

  async function persistImage(payload: ImageType) {
    const res = await fetch('/api/driver-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error ?? 'upload failed')
    return data.image as UploadedImage
  }

  function updateField<K extends keyof DriverFormState>(key: K, value: DriverFormState[K]) {
    if (key === 'phone') {
      value = formatePhoneNumber(value as string) as DriverFormState[K]
    }

    setForm((current) => ({ ...current, [key]: value }))
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

    setSaving(true)
    try {
      const res = await fetch('/api/drivers', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
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
                <p className="mt-2 text-sm font-medium text-slate-500">กรอกข้อมูลพื้นฐานและอัปโหลดเอกสารผ่าน UploadThing</p>
              </div>
              <button type="button" onClick={closeDrawer} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="mt-6 flex-1 space-y-6 overflow-auto pr-1" onSubmit={submitForm}>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="fullName">ชื่อ-นามสกุลคนขับ *</Label>
                  <Input id="fullName" maxLength={150} value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} required />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
                  <Input id="phone" maxLength={10} minLength={10} value={form.phone} onChange={(e) => updateField('phone', e.target.value)} required />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="remark">หมายเหตุ</Label>
                  <Textarea id="remark" maxLength={500} value={form.remark ?? ''} onChange={(e) => updateField('remark', e.target.value)} />
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-950">รูปบัตรประชาชน</div>
                    </div>
                    {form.cardImageId ? <Badge variant="success">อัปโหลดแล้ว</Badge> : <Badge variant="destructive">ยังไม่มี</Badge>}
                  </div>
                  <div className="overflow-hidden rounded-lg border bg-slate-300 text-start flex items-start justify-start text-sm font-medium text-black/50 px-2">
                    <UploadButton<OurFileRouter, "driverImage">
                      endpoint="driverImage"
                      className="ut-button text-slate-950"
                      onChange={(files: File[]) => setCardFile?.(files[0] ?? null)}
                      onClientUploadComplete={async (res: { url: string; name: string; size?: number; type?: string }[]) => {
                        if (!res?.[0]) return
                        const uploaded = res[0]
                        const image = await persistImage({
                          key: uploaded.url.split('/').pop() ?? uploaded.url,
                          url: uploaded.url,
                          name: uploaded.name,
                          size: cardFile?.size ?? uploaded.size,
                          type: cardFile?.type ?? uploaded.type,
                        })
                        updateField('cardImageId', image.id)
                      }}
                      onUploadError={(err: any) => setError(err.message || 'อัปโหลดรูปบัตรไม่สำเร็จ')} 
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-950">รูปใบขับขี่</div>
                    </div>
                    {form.licenseImageId ? <Badge variant="success">อัปโหลดแล้ว</Badge> : <Badge variant="destructive">ยังไม่มี</Badge>}
                  </div>
                  <div className="overflow-hidden rounded-lg border bg-slate-300 text-start flex items-start justify-start text-sm font-medium text-black/50 px-2">
                    <UploadButton<OurFileRouter, "driverImage">
                      endpoint="driverImage"
                      className="ut-button text-slate-950"
                      onChange={(files: File[]) => setLicenseFile?.(files[0] ?? null)}
                      onClientUploadComplete={async (res: { url: string; name: string; size?: number; type?: string }[]) => {
                        if (!res?.[0]) return
                        const uploaded = res[0] 
                        const image = await persistImage({
                          key: uploaded.url.split('/').pop() ?? uploaded.url,
                          url: uploaded.url,
                          name: uploaded.name,
                          size: licenseFile?.size ?? uploaded.size,
                          type: licenseFile?.type ?? uploaded.type,
                        })
                        updateField('licenseImageId', image.id)
                      }}
                      onUploadError={(err: any) => setError(err.message || 'อัปโหลดรูปใบขับขี่ไม่สำเร็จ')}
                    />
                  </div>
                </div>
              </div>

              <div className='rounded-2xl border border-slate-200 p-4'>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-500">
                    <div className="font-bold text-slate-950">สถานะเอกสาร</div>
                    <div>อัปโหลดไฟล์ครบแล้วค่อยบันทึกข้อมูล</div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={form.cardImageId ? 'success' : 'destructive'}>Card</Badge>
                    <Badge variant={form.licenseImageId ? 'success' : 'destructive'}>License</Badge>
                  </div>
                </div>
                {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
              </div>

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