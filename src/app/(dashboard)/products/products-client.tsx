'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Edit, Plus, X, Ticket } from 'lucide-react'
import { Badge, Button, Input, Label, Textarea, Switch, Card, CardContent, Field, FieldLabel, FieldGroup } from '@/components/ui'
import { AlertDialogDestructive } from '@/components/AlertDialogDestructive'
import { cn } from '@/lib/utils'
import { formatBaht, formatThaiDate } from '@/lib/ui-format'
import { ProductRow, ProductEmptyForm, ProductFormState } from '@/lib/types'

function toDateInputValue(value: string) {
  return value ? value.slice(0, 10) : ''
}

function calcDateCount(start: string, end: string) {
  if (!start || !end) return 0
  const startDate = new Date(`${start}T00:00:00`)
  const endDate = new Date(`${end}T00:00:00`)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0
  return Math.max(Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1, 0)
}

function productToForm(product?: ProductRow | null): ProductFormState {
  if (!product) return ProductEmptyForm
  return {
    products_name: product.products_name,
    products_desc: product.products_desc,
    products_remark: product.products_remark,
    products_price: String(product.products_price),
    date_start: toDateInputValue(product.date_start),
    date_end: toDateInputValue(product.date_end),
    date_count: String(product.date_count),
    is_active: product.is_active,
  }
}

export default function ProductsClient({ initialProducts }: { initialProducts: ProductRow[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [errorForm, setErrorForm] = useState<Record<string, string>>({})
  const [form, setForm] = useState<ProductFormState>(ProductEmptyForm)

  const editingProduct = useMemo(
    () => products.find((product) => product.id === editingId) ?? null,
    [editingId, products]
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(ProductEmptyForm)
    setError('')
    setErrorForm({})
    setOpen(true)
  }

  function openEdit(product: ProductRow) {
    setEditingId(product.id)
    setForm(productToForm(product))
    setError('')
    setErrorForm({})
    setOpen(true)
  }

  function closeForm() {
    if (saving) return
    setOpen(false)
  }

  function handleSpeedDialOpen() {
    setMenuOpen((value) => !value)
  }

  function handleCreateClick() {
    setMenuOpen(false)
    openCreate()
  }

  function updateField<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value }
      if (key === 'date_start' || key === 'date_end') {
        next.date_count = String(calcDateCount(next.date_start, next.date_end))

        if (next.date_end < toDateInputValue(new Date().toISOString())) {
          next.is_active = false
        } else if (next.is_active === false && next.date_end >= toDateInputValue(new Date().toISOString())) {
          next.is_active = true
        }
      }

      return next
    })

    if (errorForm[key]) {
      setErrorForm((prev) => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })
    }
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const newErrors: Record<string, string> = {}
    if (!form.products_name.trim()) newErrors.products_name = 'กรุณากรอกชื่อเรทราคา/โปรโมชั่น'
    if (!form.products_price || Number(form.products_price) < 0) newErrors.products_price = 'กรุณากรอกราคาขายต่อวันให้ถูกต้อง'
    if (!form.date_start || !form.date_end) newErrors.date_start = 'กรุณาระบุวันเริ่มต้นและวันสิ้นสุด'

    if (Object.keys(newErrors).length > 0) {
      setErrorForm(newErrors)
      return
    }

    setErrorForm({})

    const payload = {
      products_name: form.products_name.trim(),
      products_desc: form.products_desc.trim(),
      products_remark: form.products_remark.trim(),
      products_price: Number(form.products_price) || 0,
      date_start: form.date_start,
      date_end: form.date_end,
      date_count: calcDateCount(form.date_start, form.date_end),
      is_active: form.is_active,
    }

    setSaving(true)
    try {
      const res = await fetch('/api/products', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'ไม่สามารถบันทึกข้อมูลได้')
        return
      }

      const row: ProductRow = data.product
      setProducts((current) => {
        if (editingId) return current.map((item) => (item.id === row.id ? row : item))
        return [row, ...current]
      })
      setOpen(false)
    } catch {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')
    } finally {
      setSaving(false)
    }
  }

  async function deleteProduct(id: string) {
    const res = await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data?.error ?? 'ไม่สามารถลบข้อมูลได้')
      return
    }
    setProducts((current) => current.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-8">

      {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
      
      {products.length > 0 ? (
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-950">รายการล่าสุด</h2>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-245 text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-sm font-extrabold text-slate-950">
                    <th className="px-3 py-3">ชื่อเรทราคา/โปรโมชั่น</th>
                    <th className="px-3 py-3">ราคาขายต่อวัน</th>
                    <th className="px-3 py-3">ระยะเวลา</th>
                    <th className="px-3 py-3">จำนวนวัน</th>
                    <th className="px-3 py-3">สถานะ</th>
                    <th className="px-3 py-3">การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-slate-100 text-sm font-medium text-slate-700">
                      <td className="px-3 py-4">
                        <div className="font-bold text-slate-950">{product.products_name}</div>
                        <div className="mt-1 line-clamp-1 text-xs text-slate-500">{product.products_desc || '-'}</div>
                      </td>
                      <td className="px-3 py-4 font-semibold text-slate-950">{formatBaht(product.products_price)}</td>
                      <td className="px-3 py-4">{formatThaiDate(product.date_start)} ถึง {formatThaiDate(product.date_end)}</td>
                      <td className="px-3 py-4">{product.date_count} วัน</td>
                      <td className="px-3 py-4">
                        <Badge variant={product.is_active ? 'success' : 'destructive'}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => openEdit(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialogDestructive
                            onClick={() => deleteProduct(product.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!products.length ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-10 text-center text-sm font-semibold text-slate-500">
                        ยังไม่มีข้อมูลโปรโมชั่น
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Ticket className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-slate-950">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">ลองเปลี่ยนคำค้นหาหรือตัวกรองอีกครั้ง</p>
          </CardContent>
        </Card>
      )}

      {open && (
        <>
          <button
            type="button"
            aria-label="Close drawer"
            className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[2px] my-0"
            onClick={closeForm}
          />

          <aside className="fixed right-0 top-0 z-40 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <Card className="h-full rounded-none border-0">
              <CardContent className="flex h-full flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-950">
                      {editingProduct ? 'แก้ไขบริการ/โปรโมชั่น' : 'เพิ่มบริการ/โปรโมชั่น'}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      กรอกข้อมูลบริการ/โปรโมชั่นเพื่อเพิ่มเข้าระบบ
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form className="mt-6 flex-1 space-y-5 overflow-y-auto pr-1" onSubmit={submitForm}>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Label htmlFor="products_name">ชื่อบริการ หรือชื่อโปรโมชั่น <span className="text-red-600">*</span></Label>
                      <Input id="products_name" maxLength={255} value={form.products_name} onChange={(e) => updateField('products_name', e.target.value)} />
                      {errorForm.products_name && (
                        <p className="mt-1 text-xs font-medium text-red-600">{errorForm.products_name}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="products_desc">รายละเอียด</Label>
                      <Input id="products_desc" maxLength={255} value={form.products_desc} onChange={(e) => updateField('products_desc', e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="products_remark">หมายเหตุ</Label>
                      <Textarea id="products_remark" maxLength={500} value={form.products_remark} onChange={(e) => updateField('products_remark', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="products_price">ราคาขายต่อวัน <span className="text-red-600">*</span></Label>
                      <Input id="products_price" type="number" min="0" step="0.01" value={form.products_price} onChange={(e) => updateField('products_price', e.target.value)} />
                      {errorForm.products_price && (
                        <p className="mt-1 text-xs font-medium text-red-600">{errorForm.products_price}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="date_count">จำนวนวัน</Label>
                      <Input id="date_count" type="number" value={form.date_count} readOnly />
                    </div>
                    <div>
                      <Label htmlFor="date_start">วัน-เวลาที่เริ่มใช้ราคานี้ <span className="text-red-600">*</span></Label>
                      <Input id="date_start" type="date" value={form.date_start} onChange={(e) => updateField('date_start', e.target.value)} />
                      {errorForm.date_start && (
                        <p className="mt-1 text-xs font-medium text-red-600">{errorForm.date_start}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="date_end">วัน-เวลาที่สิ้นสุดราคานี้ <span className="text-red-600">*</span></Label>
                      <Input id="date_end" type="date" value={form.date_end} min={form.date_start} onChange={(e) => updateField('date_end', e.target.value)} />
                    </div>
                    <div className="md:col-span-2 flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                      <div className="text-sm font-bold text-slate-950 w-full">สถานะการใช้งาน</div>
                      <FieldGroup>
                        <Field orientation="horizontal">
                          <FieldLabel htmlFor="switch-size-default" className={cn(!form.is_active ? 'text-slate-700' : 'text-slate-300',"text-sm font-semibold text-end justify-end")}>Inactive</FieldLabel>
                          <Switch 
                            id="switch-size-default" 
                            size="default" 
                            checked={form.is_active} 
                            onCheckedChange={(checked) => updateField('is_active', checked)} 
                          />
                          <FieldLabel htmlFor="switch-size-default" className={cn(form.is_active ? 'text-slate-700' : 'text-slate-300',"text-sm font-semibold")}>Active</FieldLabel>
                        </Field>
                      </FieldGroup>
                    </div>
                  </div>

                  {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

                  <div className="flex items-center justify-end gap-3 w-full border-t border-slate-200 pt-5">
                    <Button type="submit" disabled={saving} className="gap-2 w-full" variant="save">
                      {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </aside>
        </>
      )}

      {menuOpen && (
        <button
          type="button"
          aria-label="Close speed dial"
          className="fixed inset-0 z-30 bg-transparent"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {menuOpen && (
          <>
            <button
              type="button"
              onClick={handleCreateClick}
              className={cn(
                'group flex items-center gap-4 rounded-2xl border bg-white px-4 py-3 text-left shadow-lg shadow-slate-950/10 transition-all duration-200',
                'min-w-47.5 max-w-60',
                'border-slate-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/50'
              )}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 shadow-sm transition group-hover:bg-white group-hover:text-violet-700">
                <Ticket className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="truncate text-sm font-bold text-slate-900">เพิ่มบริการ/โปรโมชั่น</div>
            </button>
          </>
        )}

        {!open && (
          <>
            <Button
              type="button"
              size="lg"
              onClick={handleSpeedDialOpen}
              className={cn(
                'h-14 w-14 rounded-xl border-2 border-violet-200 bg-violet-600 shadow-2xl shadow-violet-900/25',
                'hover:bg-violet-700'
              )}
            >
              {menuOpen ? <X className="h-7 w-7" aria-hidden="true" /> : <Plus className="h-7 w-7" aria-hidden="true" />}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
