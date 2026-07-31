'use client'

import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState, type FormEvent, type ChangeEvent } from 'react'
import { X, Badge } from 'lucide-react'
import { Button, Input, Label, Select, Textarea } from '@/components/ui'
import { useRouter } from 'next/navigation'
import { BookingStatusOptions, BookingOption, CarStatus } from '@/lib/types'
import CardUploadImage from '@/components/CardUploadImage'
import { DateTimePicker } from '@/components/DateTimePicker';
import { formatCompactNumber, toNumber } from '@/lib/ui-format'
import { cn } from '@/lib/utils'

     
function dateCount(start: Date | undefined, end: Date | undefined) {
  if (!start || !end) return 0
  const a = new Date(start)
  const b = new Date(end)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  return Math.max(Math.ceil((b.getTime() - a.getTime()) / 86_400_000), 0)
}

interface From {
  productId: string
  carId: string
  userId: string
  driverId: string
  dateStart: Date | undefined
  dateEnd: Date | undefined
  price: string
  discountAmount: string
  taxAmount: string
  bookingStatus: string
  bookingRemark: string
  paymentImageId: string
  healthCheck01ImageId: string
  healthCheck02ImageId: string
  mileage: string
}

interface BookingsDrawerProps {
  products?: BookingOption[]
  cars?: BookingOption[]
  drivers?: BookingOption[]
  users?: BookingOption[]
  currentUserId?: string
  editingId?: string | null 
  formIn?: From
  errorIn?: string
  setDrawerOpen?: any
  setBookings: Dispatch<SetStateAction<any[]>> 
}

export default function BookingsDrawer({ 
  products,
  cars,
  drivers,
  users,
  currentUserId,
  editingId,
  formIn,
  errorIn,
  setDrawerOpen,
  setBookings
}: BookingsDrawerProps) {
  const [errorForm, setErrorForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(errorIn || '')
  const empty = {
    productId: '',
    carId: '',
    userId: currentUserId || '',
    driverId: '',
    dateStart: undefined,
    dateEnd: undefined,
    price: '0',
    discountAmount: '0',
    taxAmount: '0',
    bookingStatus: 'Pending',
    bookingRemark: '',
    paymentImageId: '',
    healthCheck01ImageId: '',
    healthCheck02ImageId: '',
    mileage: '0',
  }
  const [form, setForm] = useState(formIn || empty)
  const paymentInputRef = useRef<HTMLInputElement>(null)
  const healthCheck01InputRef = useRef<HTMLInputElement>(null)
  const healthCheck02InputRef = useRef<HTMLInputElement>(null)
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [healthCheck01File, setHealthCheck01File] = useState<File | null>(null)
  const [healthCheck02File, setHealthCheck02File] = useState<File | null>(null)
  const [uploadingPayment, setUploadingPayment] = useState(false)
  const [uploadingHealthCheck01, setUploadingHealthCheck01] = useState(false)
  const [uploadingHealthCheck02, setUploadingHealthCheck02] = useState(false)
  const [paymentPreview, setPaymentPreview] = useState<string | null>(null)
  const [healthCheck01Preview, setHealthCheck01Preview] = useState<string | null>(null)
  const [healthCheck02Preview, setHealthCheck02Preview] = useState<string | null>(null)
  const [lastReservedCarId, setLastReservedCarId] = useState<string | null>(null)

  const selectedProduct = useMemo(() => products?.find((p) => p.id === form.productId), [form.productId, products])
  const days = useMemo(() => dateCount(form.dateStart, form.dateEnd), [form.dateStart, form.dateEnd])
  const dailyRate = Number(form.price || selectedProduct?.price || 0)
  const gross = Number((dailyRate * days).toFixed(2))
  const discount = Number(form.discountAmount || 0)
  const tax = Number(form.taxAmount || 0)
  const total = Number(Math.max(gross - discount + tax, 0).toFixed(2))
  const router = useRouter()

  const paymentStatusLabel = paymentFile ? 'preview' : form.paymentImageId ? 'uploaded' : null
  const healthCheck01StatusLabel = healthCheck01File ? 'preview' : form.healthCheck01ImageId ? 'uploaded' : null
  const healthCheck02StatusLabel = healthCheck02File ? 'preview' : form.healthCheck02ImageId ? 'uploaded' : null

  const carsAvailable = cars?.filter((rows) => editingId ? rows.status === 'Available' || rows.id === form.carId : rows.status === 'Available')
  const carsMileage = form.carId ? cars?.filter((rows) => rows.id === form.carId)[0].mileage : 0;

  useEffect(() => {
    if (!paymentFile) {
      setPaymentPreview(null)
      return
    }
    const preview = URL.createObjectURL(paymentFile)
    setPaymentPreview(preview)
    return () => URL.revokeObjectURL(preview)
  }, [paymentFile])

  useEffect(() => {
    if (!healthCheck01File) {
      setHealthCheck01Preview(null)
      return
    }
    const preview = URL.createObjectURL(healthCheck01File)
    setHealthCheck01Preview(preview)
    return () => URL.revokeObjectURL(preview)
  }, [healthCheck01File])

  useEffect(() => {
    if (!healthCheck02File) {
      setHealthCheck02Preview(null)
      return
    }
    const preview = URL.createObjectURL(healthCheck02File)
    setHealthCheck02Preview(preview)
    return () => URL.revokeObjectURL(preview)
  }, [healthCheck02File])

  useEffect(() => {
    setError(errorIn || '')
    setForm(formIn || empty)
    setPaymentFile(null)
    setHealthCheck01File(null)
    setHealthCheck02File(null)
    setPaymentPreview(null)
    setHealthCheck01Preview(null)
    setHealthCheck02Preview(null)
    setLastReservedCarId(null)
  }, [errorIn, formIn])

  async function setCarStatus(carId: string, status: CarStatus, expectedStatus?: CarStatus) {
    if (!carId) return
    const res = await fetch('/api/cars', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: carId, status, expectedStatus }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error ?? 'ไม่สามารถอัปเดตสถานะรถได้')
  }

  function triggerPicker(kind: 'payment' | 'healthCheck01' | 'healthCheck02') {
    if (kind === 'payment') paymentInputRef.current?.click()
    else if (kind === 'healthCheck01') healthCheck01InputRef.current?.click()
    else healthCheck02InputRef.current?.click()
  }

  async function sendImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/booking-images', { method: 'POST', body: formData })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error ?? 'ไม่สามารถอัปโหลดรูปภาพได้')
    return data.image as { id: string; url: string; key: string; name: string }
  }

  async function syncBookingImage(nextForm: From) {
    if (!editingId) return
    const payload = {
      ...nextForm,
      bookingPaymentImagesId: nextForm.paymentImageId || null,
      bookingHealthCheck01ImagesId: nextForm.healthCheck01ImageId || null,
      bookingHealthCheck02ImagesId: nextForm.healthCheck02ImageId || null,
      dateCount: days,
      dailyRate: gross,
      totalAmount: total,
    }
    const res = await fetch(`/api/bookings/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.message ?? data?.error ?? 'บันทึกไม่สำเร็จ')
    setBookings((current) => current.map((item) => (item.id === editingId ? data.booking : item)))
  }

  async function uploadImage(kind: 'payment' | 'healthCheck01' | 'healthCheck02') {
    const file = kind === 'payment' ? paymentFile : kind === 'healthCheck01' ? healthCheck01File : healthCheck02File
    if (!file) return
      if (kind === 'payment') setUploadingPayment(true)
    if (kind === 'healthCheck01') setUploadingHealthCheck01(true)
    if (kind === 'healthCheck02') setUploadingHealthCheck02(true)

    try {
      const image = await sendImage(file)
      const nextForm = {
        ...form,
        [kind === 'payment' ? 'paymentImageId' : kind === 'healthCheck01' ? 'healthCheck01ImageId' : 'healthCheck02ImageId']: image.id,
      }
      setForm(nextForm)
      if (kind === 'payment') setPaymentFile(null)
      if (kind === 'healthCheck01') setHealthCheck01File(null)
      if (kind === 'healthCheck02') setHealthCheck02File(null)
      if (editingId) {
        await syncBookingImage(nextForm)
      }
    } catch (err: any) {
      setError(err?.message ?? 'ไม่สามารถอัปโหลดรูปภาพได้')
    } finally {
      if (kind === 'payment') setUploadingPayment(false)
      if (kind === 'healthCheck01') setUploadingHealthCheck01(false)
      if (kind === 'healthCheck02') setUploadingHealthCheck02(false)
    }
  }

  async function deleteImage(kind: 'payment' | 'healthCheck01' | 'healthCheck02') {
    const nextForm = {
      ...form,
      [kind === 'payment' ? 'paymentImageId' : kind === 'healthCheck01' ? 'healthCheck01ImageId' : 'healthCheck02ImageId']: '',
    }
    setForm(nextForm)
    if (kind === 'payment') setPaymentFile(null)
    if (kind === 'healthCheck01') setHealthCheck01File(null)
    if (kind === 'healthCheck02') setHealthCheck02File(null)
    if (editingId) {
      try {
        await syncBookingImage(nextForm)
      } catch (err: any) {
        setError(err?.message ?? 'ไม่สามารถลบรูปภาพได้')
      }
    }
  }

  async function closeDrawer() {
    if (saving) return
    if (!editingId && lastReservedCarId) {
      try {
        await setCarStatus(lastReservedCarId, 'Available', 'Reserved')
      } catch {
        // ignore rollback errors when closing
      }
    }
    setDrawerOpen(false)
  }
 
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const newErrors: Record<string, string> = {}
    if (!form.productId.trim()) newErrors.productId = 'กรุณากรอกชื่อข้อมูลบริการ'
    if (!form.carId.trim()) newErrors.carId = 'กรุณากรอกชื่อข้อมูลรถ'
    if (!form.driverId.trim()) newErrors.driverId = 'กรุณากรอกชื่อข้อมูลคนขับ'
    if (!form.dateStart || !form.dateEnd) newErrors.dateStart = 'กรุณาระบุวันเริ่มต้นและวันสิ้นสุด'
    if (!form.price || Number(form.price) < 0) newErrors.price = 'กรุณากรอกราคาขายต่อวันให้ถูกต้อง'
    if (!form.mileage || Number(form.mileage) < Number(carsMileage)) newErrors.mileage = 'เลขไมล์ใหม่จะต้องมากกว่าหรือเท่ากับเลขไมล์ปัจจุบัน'

    if (Object.keys(newErrors).length > 0) {
      setErrorForm(newErrors)
      return
    }

    setErrorForm({})
    setSaving(true)
    setError('')
    try {
      if (!form.productId || !form.carId || !form.userId || !form.dateStart || !form.dateEnd) {
        setError('กรุณากรอกข้อมูลบังคับให้ครบ')
        return
      }
      const payload = {
        ...form,
        bookingPaymentImagesId: form.paymentImageId || null,
        bookingHealthCheck01ImagesId: form.healthCheck01ImageId || null,
        bookingHealthCheck02ImagesId: form.healthCheck02ImageId || null,
        dateCount: days,
        dailyRate: gross,
        totalAmount: total,
      }
      const res = await fetch(editingId ? `/api/bookings/${editingId}` : '/api/bookings', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? 'บันทึกไม่สำเร็จ')
      const row = data.booking
      setLastReservedCarId(null)
      setBookings((current) => editingId ? current.map((item) => (item.id === row.id ? row : item)) : [row, ...current])
      setDrawerOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err?.message ?? 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  async function handleCarChange(nextCarId: string) {
    const prevCarId = form.carId
    setForm((current) => ({ ...current, carId: nextCarId }))

    if (editingId) return

    try {
      if (prevCarId && prevCarId !== nextCarId) {
        await setCarStatus(prevCarId, 'Available', 'Reserved')
      }
      if (nextCarId) {
        await setCarStatus(nextCarId, 'Reserved', 'Available')
        setLastReservedCarId(nextCarId)
      }
    } catch (err: any) {
      setError(err?.message ?? 'ไม่สามารถอัปเดตสถานะรถได้')
      setForm((current) => ({ ...current, carId: prevCarId }))
    }
  }

  function handleCarsMileage(event: ChangeEvent<HTMLInputElement>) {
    event.preventDefault()
    setForm((c) => ({ ...c, mileage: event.target.value }))

    const newErrors: Record<string, string> = {}
    if (!event.target.value || Number(event.target.value) < Number(carsMileage)) newErrors.mileage = 'เลขไมล์ใหม่จะต้องมากกว่าหรือเท่ากับเลขไมล์ปัจจุบัน'

    if (Object.keys(newErrors).length > 0) {
      setErrorForm(newErrors)
      return
    }
    setErrorForm({})
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close drawer"
        className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[2px] my-0"
        onClick={closeDrawer}
      />

      <aside className="fixed right-0 top-0 z-40 h-full w-full max-w-2xl overflow-auto bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-950">{editingId ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">กรอกข้อมูลพื้นฐานและอัปโหลดเอกสาร</p>
          </div>
          <button type="button" className="rounded-full border p-2" onClick={closeDrawer}><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={submit} className="space-y-6 px-6 py-5">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

          {form.carId ? (
            <div className="mb-4 p-4 rounded-lg bg-amber-50 text-sm font-medium text-amber-700 relative">
              <div className='md:flex justify-baseline items-center gap-4'>
                <div className='w-full'>
                  <div className="font-bold">แจ้งเตือน: อัพเดทเลขไมล์</div>
                  <div className='text-xs font-medium'>กรุณาใส่ข้อมูลเลขไมล์ให้มากกว่าเลขไมล์ปัจจุบัน <b>{formatCompactNumber(toNumber(carsMileage))}</b></div>
                </div>
                <div className='w-full mileage'>
                  <Input 
                    id='mileage'
                    type='number'
                    step="0" 
                    value={form.mileage}
                    placeholder={`เลขไมล์ปัจจุบัน ${formatCompactNumber(toNumber(carsMileage))}`}
                    onChange={handleCarsMileage}
                    className={cn(
                      'w-full my-2',
                      errorForm.mileage ? 'border-2 border-red-600' : ''
                    )}
                  />
                  {errorForm.mileage && (
                    <p className="mt-1 text-xs font-medium text-red-600">{errorForm.mileage}</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <div>
            <Label>สถานะการจอง <span className="text-red-600">*</span></Label>
            <Select value={form.bookingStatus} onChange={(e) => setForm((c) => ({ ...c, bookingStatus: e.target.value }))}>
              {BookingStatusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
            {errorForm.bookingStatus && (
              <p className="mt-1 text-xs font-medium text-red-600">{errorForm.bookingStatus}</p>
            )}
          </div>

          <div>
            <Label>ข้อมูลบริการ <span className="text-red-600">*</span></Label>
            <Select value={form.productId} onChange={(e) => setForm((c) => ({ ...c, productId: e.target.value, price: String(products?.find((p) => p.id === e.target.value)?.price ?? c.price) }))}>
              <option value="">เลือกข้อมูลบริการ</option>
              {products?.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </Select>
            {errorForm.productId && (
              <p className="mt-1 text-xs font-medium text-red-600">{errorForm.productId}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>รายการรถ <span className="text-red-600">*</span></Label>
              <Select value={form.carId} onChange={(e) => handleCarChange(e.target.value)}>
                <option value="">เลือกรายการรถ</option>
                {carsAvailable?.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </Select>
              {errorForm.carId && (
                <p className="mt-1 text-xs font-medium text-red-600">{errorForm.carId}</p>
              )}
            </div>
            <div>
              <Label>ข้อมูลลูกค้า <span className="text-red-600">*</span></Label>
              <Select value={form.driverId} onChange={(e) => setForm((c) => ({ ...c, driverId: e.target.value }))}>
                <option value="">เลือกข้อมูลลูกค้า</option>
                {drivers?.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </Select>
              {errorForm.driverId && (
                <p className="mt-1 text-xs font-medium text-red-600">{errorForm.driverId}</p>
              )}
            </div>
            <div>
              <Label>ข้อมูลผู้ให้เช่า <span className="text-red-600">*</span></Label>
              <Select value={form.userId} onChange={(e) => setForm((c) => ({ ...c, userId: e.target.value }))}>
                <option value="">เลือกข้อมูลผู้ให้เช่า</option>
                {users?.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </Select>
              {errorForm.userId && (
                <p className="mt-1 text-xs font-medium text-red-600">{errorForm.userId}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>วันที่-เวลา รับรถ <span className="text-red-600">*</span></Label>
              <DateTimePicker
                onChange={(date) => setForm((c) => ({ ...c, dateStart: date }))}
                value={form.dateStart ? new Date(form.dateStart) : undefined}
                timezone="Asia/Bangkok"
                displayFormat="dd/MM/yyyy hh:mm"
                clearable
                required
              />
              {errorForm.dateStart && (
                <p className="mt-1 text-xs font-medium text-red-600">{errorForm.dateStart}</p>
              )}
            </div>
            <div>
              <Label>วันที่-เวลา ส่งคืน <span className="text-red-600">*</span></Label>
              <DateTimePicker
                onChange={(date) => setForm((c) => ({ ...c, dateEnd: date }))}
                value={form.dateEnd ? new Date(form.dateEnd) : undefined}
                timezone="Asia/Bangkok"
                displayFormat="dd/MM/yyyy hh:mm"
                clearable
                required
              />
              {errorForm.dateEnd && (
                <p className="mt-1 text-xs font-medium text-red-600">{errorForm.dateEnd}</p>
              )}
            </div>
            <div>
              <Label>จำนวนวัน</Label>
              <Input value={days} readOnly />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>ราคาต่อวัน <span className="text-red-600">*</span></Label>
              <div className='relative'>
                <Input type="number" className='text-right pr-8' min="0" step="0.01" value={form.price} onChange={(e) => setForm((c) => ({ ...c, price: e.target.value }))} />
                <div className='h-fit absolute right-1 top-0 bottom-0 m-auto'>
                  <div className='relative'>
                    <Badge />
                    <span className='w-fit absolute right-0 left-0 top-0 bottom-0 m-auto'>฿</span>
                  </div>
                </div>
              </div>
              {errorForm.price && (
                <p className="mt-1 text-xs font-medium text-red-600">{errorForm.price}</p>
              )}
            </div>
            <div>
              <Label>ส่วนลด</Label>
              <div className='relative'>
                <Input type="number" className='text-right pr-8' min="0" step="0.01" value={form.discountAmount} onChange={(e) => setForm((c) => ({ ...c, discountAmount: e.target.value }))} />
                <div className='h-fit absolute right-1 top-0 bottom-0 m-auto'>
                  <div className='relative'>
                    <Badge />
                    <span className='w-fit absolute right-0 left-0 top-0 bottom-0 m-auto'>฿</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Label>ยอดรวมก่อนหักส่วนลด <span className="text-red-600">*</span></Label>
              <div className='relative'>
                <Input className='text-right pr-8' value={gross} readOnly />
                <div className='h-fit absolute right-1 top-0 bottom-0 m-auto'>
                  <div className='relative'>
                    <Badge />
                    <span className='w-fit absolute right-0 left-0 top-0 bottom-0 m-auto'>฿</span>
                  </div>
                </div>
              </div>
            </div>
            <div className='hidden'>
              <Label>VAT / ภาษี</Label>
              <Input type="number" className='text-right' min="0" step="0.01" value={form.taxAmount} onChange={(e) => setForm((c) => ({ ...c, taxAmount: e.target.value }))} />
            </div>
            <div>
              <Label>ยอดรวมทั้งหมด <span className="text-red-600">*</span></Label>
              <div className='relative'>
                <Input className='text-right pr-8' value={total} readOnly />
                <div className='h-fit absolute right-1 top-0 bottom-0 m-auto'>
                  <div className='relative'>
                    <Badge />
                    <span className='w-fit absolute right-0 left-0 top-0 bottom-0 m-auto'>฿</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>หมายเหตุ</Label>
              <Textarea maxLength={500} value={form.bookingRemark} onChange={(e) => setForm((c) => ({ ...c, bookingRemark: e.target.value }))} />
            </div>
          </div>

          <CardUploadImage
              title="หลักฐานการรับเงิน"
              preview={paymentPreview}
              statusLabel={paymentStatusLabel}
              inputRef={paymentInputRef}
              onPick={() => triggerPicker('payment')}
              onChange={(file) => setPaymentFile(file)}
              onUpload={() => uploadImage('payment')}
              onDelete={() => deleteImage('payment')}
              uploading={uploadingPayment}
            />

            <CardUploadImage
              title="เอกสารสัญญาเช่ารถ"
              preview={healthCheck01Preview}
              statusLabel={healthCheck01StatusLabel}
              inputRef={healthCheck01InputRef}
              onPick={() => triggerPicker('healthCheck01')}
              onChange={(file) => setHealthCheck01File(file)}
              onUpload={() => uploadImage('healthCheck01')}
              onDelete={() => deleteImage('healthCheck01')}
              uploading={uploadingHealthCheck01}
            />

            <CardUploadImage
              title="ตรวจรับรถ"
              preview={healthCheck02Preview}
              statusLabel={healthCheck02StatusLabel}
              inputRef={healthCheck02InputRef}
              onPick={() => triggerPicker('healthCheck02')}
              onChange={(file) => setHealthCheck02File(file)}
              onUpload={() => uploadImage('healthCheck02')}
              onDelete={() => deleteImage('healthCheck02')}
              uploading={uploadingHealthCheck02}
            />

          <div className="flex items-center justify-end gap-3 w-full border-t border-slate-200 pt-5">
            <Button type="submit" disabled={saving} className="gap-2 w-full" variant="save">
              {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </Button>
          </div>
        </form>
      </aside>
    </>
  )
};
