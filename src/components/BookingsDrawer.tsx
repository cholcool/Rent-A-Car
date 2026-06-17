'use client'

import { Dispatch, SetStateAction, useMemo, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { UploadButton } from '@uploadthing/react'
import type { OurFileRouter } from '@/app/api/uploadthing/core'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
import Select from '@/components/ui/select'
import Textarea from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'

const statusOptions = ['Pending', 'Confirmed', 'InProgress', 'Completed', 'Cancelled', 'Rejected'] as const
     
function dateCount(start: string, end: string) {
  if (!start || !end) return 0
  const a = new Date(start)
  const b = new Date(end)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  return Math.max(Math.ceil((b.getTime() - a.getTime()) / 86_400_000) + 1, 0)
}

function uploadKey(url: string) {
  const parts = url.split('/')
  return parts[parts.length - 1] ?? url
}

type Row = any
type Option = { id: string; label: string; price?: number }

interface From {
  productId: string
  carId: string
  userId: string
  driverId: string
  dateStart: string
  dateEnd: string
  price: string
  discountAmount: string
  taxAmount: string
  bookingStatus: string
  bookingRemark: string
  paymentImageId: string
  healthCheck01ImageId: string
  healthCheck02ImageId: string
}

interface BookingsDrawerProps {
  products?: Option[]
  cars?: Option[]
  drivers?: Option[]
  currentUserId?: string
  editingId?: string | null 
  formIn?: From
  errorIn?: string
  setDrawerOpen?: any
  setBookings: Dispatch<SetStateAction<Row[]>> 
}

export default function BookingsDrawer({ 
  products,
  cars,
  drivers,
  currentUserId,
  editingId,
  formIn,
  errorIn,
  setDrawerOpen,
  setBookings
}: BookingsDrawerProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(errorIn || '')
  const empty = {
    productId: '',
    carId: '',
    userId: currentUserId,
    driverId: '',
    dateStart: '',
    dateEnd: '',
    price: '0',
    discountAmount: '0',
    taxAmount: '0',
    bookingStatus: 'Pending',
    bookingRemark: '',
    paymentImageId: '',
    healthCheck01ImageId: '',
    healthCheck02ImageId: '',
  }
  const [form, setForm] = useState(formIn || empty)

  const selectedProduct = useMemo(() => products?.find((p) => p.id === form.productId), [form.productId, products])
  const days = useMemo(() => dateCount(form.dateStart, form.dateEnd), [form.dateStart, form.dateEnd])
  const dailyRate = Number(form.price || selectedProduct?.price || 0)
  const gross = Number((dailyRate * days).toFixed(2))
  const discount = Number(form.discountAmount || 0)
  const tax = Number(form.taxAmount || 0)
  const total = Number(Math.max(gross - discount + tax, 0).toFixed(2))
  const router = useRouter()
 
  async function persistImage(payload: { key: string; url: string; name: string; size?: number; type?: string }) {
    const res = await fetch('/api/booking-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error ?? 'upload failed')
    return data.image as { id: string }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (!form.productId || !form.carId || !form.userId || !form.dateStart || !form.dateEnd) {
        setError('กรุณากรอกข้อมูลบังคับให้ครบ')
        return
      }
      const payload = {
        ...form,
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
      setBookings((current) => editingId ? current.map((item) => (item.id === row.id ? row : item)) : [row, ...current])
      setDrawerOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err?.message ?? 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close drawer"
        className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[2px] my-0"
        onClick={() => !saving && setDrawerOpen(false)}
      />

      <aside className="fixed right-0 top-0 z-40 h-full w-full max-w-2xl overflow-auto bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-950">{editingId ? 'แก้ไขรายการเช่ารถ' : 'เพิ่มรายการเช่าใหม่'}</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">กรอกข้อมูลพื้นฐานและอัปโหลดเอกสาร</p>
          </div>
          <button className="rounded-full border p-2" onClick={() => setDrawerOpen(false)}><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={submit} className="space-y-6 px-6 py-5">
          <div>
            <Label>เรทราคา / โปรโมชั่น *</Label>
            <Select value={form.productId} onChange={(e) => setForm((c) => ({ ...c, productId: e.target.value, price: String(products?.find((p) => p.id === e.target.value)?.price ?? c.price) }))} required>
              <option value="">เลือกโปรโมชั่น</option>
              {products?.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>รถที่จอง *</Label>
              <Select value={form.carId} onChange={(e) => setForm((c) => ({ ...c, carId: e.target.value }))} required>
                <option value="">เลือกคันรถ</option>
                {cars?.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </Select>
            </div>
            <div>
              <Label>ผู้จอง / คนขับ *</Label>
              <Select value={form.driverId} onChange={(e) => setForm((c) => ({ ...c, driverId: e.target.value }))} required>
                <option value="">เลือกคนขับ</option>
                {drivers?.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </Select>
            </div>
            <div>
              <Label>วันที่-เวลา รับรถ *</Label>
              <Input type="date" value={form.dateStart} onChange={(e) => setForm((c) => ({ ...c, dateStart: e.target.value }))} required />
            </div>
            <div>
              <Label>วันที่-เวลา ส่งคืน *</Label>
              <Input type="date" value={form.dateEnd} onChange={(e) => setForm((c) => ({ ...c, dateEnd: e.target.value }))} required />
            </div>
            <div>
              <Label>จำนวนวัน</Label>
              <Input value={days} readOnly />
            </div>
            <div>
              <Label>ราคาต่อวัน *</Label>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((c) => ({ ...c, price: e.target.value }))} required />
            </div>
            <div>
              <Label>ยอดรวมก่อนหักส่วนลด *</Label>
              <Input value={gross} readOnly />
            </div>
            <div>
              <Label>ส่วนลด</Label>
              <Input type="number" min="0" step="0.01" value={form.discountAmount} onChange={(e) => setForm((c) => ({ ...c, discountAmount: e.target.value }))} />
            </div>
            <div className='hidden'>
              <Label>VAT / ภาษี</Label>
              <Input type="number" min="0" step="0.01" value={form.taxAmount} onChange={(e) => setForm((c) => ({ ...c, taxAmount: e.target.value }))} />
            </div>
            <div>
              <Label>ยอดรวมทั้งหมด *</Label>
              <Input value={total} readOnly />
            </div>
            <div>
              <Label>สถานะการจอง *</Label>
              <Select value={form.bookingStatus} onChange={(e) => setForm((c) => ({ ...c, bookingStatus: e.target.value }))} required>
                {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>หมายเหตุ</Label>
              <Textarea maxLength={500} value={form.bookingRemark} onChange={(e) => setForm((c) => ({ ...c, bookingRemark: e.target.value }))} />
            </div>

            {[
              ['หลักฐานการรับเงิน', 'paymentImageId'],
              ['เอกสารสัญญาเช่ารถ', 'healthCheck01ImageId'],
              ['ตรวจรับรถ', 'healthCheck02ImageId'],
            ].map(([label, key]) => (
              <div key={String(key)} className="rounded-2xl border p-4 md:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-bold text-slate-950">{label}</div>
                  <Badge variant={form[key as keyof typeof form] ? 'success' : 'destructive'}>{form[key as keyof typeof form] ? 'อัปโหลดแล้ว' : 'ยังไม่มี'}</Badge>
                </div>
                <UploadButton<OurFileRouter, 'bookingImage'>
                  endpoint="bookingImage"
                  onClientUploadComplete={async (res) => {
                    if (!res?.[0]) return
                    const uploaded = res[0]
                    const image = await persistImage({ key: uploadKey(uploaded.url), url: uploaded.url, name: uploaded.name, size: uploaded.size, type: uploaded.type })
                    setForm((c) => ({ ...c, [key]: image.id }))
                  }}
                  onUploadError={(err) => setError(err.message || 'อัปโหลดไม่สำเร็จ')}
                />
              </div>
            ))}

            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

          </div>

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