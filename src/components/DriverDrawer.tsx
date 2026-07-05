'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { Button, Card, CardContent } from '@/components/ui'
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
import CardUploadImage from '@/components/CardUploadImage'

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
  const [errorForm, setErrorForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(errorIn)
  const [form, setForm] = useState(formIn || DriverEmptyForm)
  const [formGuarantor, setFormGuarantor] = useState<GuarantorFormState>(formGuarantorIn || GuarantorEmptyForm)
  const [cardFile, setCardFile] = useState<File | null>(null)
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [uploadingCard, setUploadingCard] = useState(false)
  const [uploadingLicense, setUploadingLicense] = useState(false)
  const router = useRouter()
  const cardInputRef = useRef<HTMLInputElement>(null)
  const licenseInputRef = useRef<HTMLInputElement>(null)
  const guarantorCardInputRef = useRef<HTMLInputElement>(null)
  const guarantorLicenseInputRef = useRef<HTMLInputElement>(null)
  
  const editingDriver = initialDrivers.find((driver) => driver.id === editingId) ?? null
  const guarantorImage = editingDriver?.guarantor

  const [cardPreview, setCardPreview] = useState<string | null>(editingDriver?.cardImage?.url ?? null)
  const [licensePreview, setLicensePreview] = useState<string | null>(editingDriver?.licenseImage?.url ?? null)
  const cardStatusLabel = cardFile ? 'ตัวอย่างรูป' : editingDriver?.cardImage ? 'อัปโหลดแล้ว' : 'ยังไม่มี'
  const licenseStatusLabel = licenseFile ? 'ตัวอย่างรูป' : editingDriver?.licenseImage ? 'อัปโหลดแล้ว' : 'ยังไม่มี'
  const [guarantorCardFile, setGuarantorCardFile] = useState<File | null>(null)
  const [guarantorLicenseFile, setGuarantorLicenseFile] = useState<File | null>(null)
  const [guarantorCardPreview, setGuarantorCardPreview] = useState<string | null>(guarantorImage?.cardImage?.url ?? null)
  const [guarantorLicensePreview, setGuarantorLicensePreview] = useState<string | null>(guarantorImage?.licenseImage?.url ?? null)
  const guarantorCardStatusLabel = guarantorCardFile ? 'ตัวอย่างรูป' : formGuarantor.cardImageId ? 'อัปโหลดแล้ว' : 'ยังไม่มี'
  const guarantorLicenseStatusLabel = guarantorLicenseFile ? 'ตัวอย่างรูป' : formGuarantor.licenseImageId ? 'อัปโหลดแล้ว' : 'ยังไม่มี'

  function updateDriverImageInState(
    targetId: string,
    ownerType: 'driver' | 'guarantor',
    kind: 'card' | 'license',
    image: { id: string; url: string; key: string; name: string }
  ) {
    setDrivers((current) =>
      current.map((item) => {
        if (item.id !== targetId) return item
        if (ownerType === 'driver') {
          return kind === 'card'
            ? { ...item, cardImageId: image.id, cardImage: image }
            : { ...item, licenseImageId: image.id, licenseImage: image }
        }
        return {
          ...item,
          guarantor: item.guarantor
            ? kind === 'card'
              ? { ...item.guarantor, cardImageId: image.id, cardImage: image }
              : { ...item.guarantor, licenseImageId: image.id, licenseImage: image }
            : item.guarantor,
        }
      })
    )
  }

  async function sendImage(ownerType: 'driver' | 'guarantor', ownerId: string, kind: 'card' | 'license', file: File) {
    const formData = new FormData()
    formData.append('ownerId', ownerId)
    formData.append('field', kind)
    formData.append('file', file)
    const res = await fetch(ownerType === 'driver' ? '/api/driver-images' : '/api/guarantor-images', { method: 'POST', body: formData })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data?.error ?? 'ไม่สามารถอัปโหลดรูปภาพได้')
    }
    return data.image as { id: string; url: string; key: string; name: string }
  }

  useEffect(() => {
    if (!cardFile) {
      setCardPreview(editingDriver?.cardImage?.url ?? null)
      return
    }
    const preview = URL.createObjectURL(cardFile)
    setCardPreview(preview)
    return () => URL.revokeObjectURL(preview)
  }, [cardFile, editingDriver?.cardImage?.url])

  useEffect(() => {
    if (!licenseFile) {
      setLicensePreview(editingDriver?.licenseImage?.url ?? null)
      return
    }
    const preview = URL.createObjectURL(licenseFile)
    setLicensePreview(preview)
    return () => URL.revokeObjectURL(preview)
  }, [licenseFile, editingDriver?.licenseImage?.url])

  useEffect(() => {
    if (!guarantorCardFile) {
      setGuarantorCardPreview(formGuarantor.cardImageId ? guarantorImage?.cardImage?.url ?? null : null)
      return
    }
    const preview = URL.createObjectURL(guarantorCardFile)
    setGuarantorCardPreview(preview)
    return () => URL.revokeObjectURL(preview)
  }, [guarantorCardFile, formGuarantor.cardImageId, guarantorImage?.cardImage?.url])

  useEffect(() => {
    if (!guarantorLicenseFile) {
      setGuarantorLicensePreview(formGuarantor.licenseImageId ? guarantorImage?.licenseImage?.url ?? null : null)
      return
    }
    const preview = URL.createObjectURL(guarantorLicenseFile)
    setGuarantorLicensePreview(preview)
    return () => URL.revokeObjectURL(preview)
  }, [guarantorLicenseFile, formGuarantor.licenseImageId, guarantorImage?.licenseImage?.url])

  useEffect(() => {
    setError(errorIn ?? '')
    setForm(formIn || DriverEmptyForm)
    setFormGuarantor(formGuarantorIn || GuarantorEmptyForm)
    setCardFile(null)
    setLicenseFile(null)
    setGuarantorCardFile(null)
    setGuarantorLicenseFile(null)
    setCardPreview(editingDriver?.cardImage?.url ?? null)
    setLicensePreview(editingDriver?.licenseImage?.url ?? null)
    setGuarantorCardPreview(guarantorImage?.cardImage?.url ?? null)
    setGuarantorLicensePreview(guarantorImage?.licenseImage?.url ?? null)
  }, [
    editingId,
    editingDriver?.cardImage?.url,
    editingDriver?.licenseImage?.url,
    guarantorImage?.cardImage?.url,
    guarantorImage?.licenseImage?.url,
    errorIn,
    formIn,
    formGuarantorIn,
  ])

  function triggerPicker(ownerType: 'driver' | 'guarantor', kind: 'card' | 'license') {
    if (ownerType === 'driver') {
      if (kind === 'card') cardInputRef.current?.click()
      else licenseInputRef.current?.click()
      return
    }
    if (kind === 'card') guarantorCardInputRef.current?.click()
    else guarantorLicenseInputRef.current?.click()
  }

  async function uploadImage(ownerType: 'driver' | 'guarantor', kind: 'card' | 'license') {
    if (!editingId) return
    const file =
      ownerType === 'driver'
        ? kind === 'card'
          ? cardFile
          : licenseFile
        : kind === 'card'
          ? guarantorCardFile
          : guarantorLicenseFile
    if (!file) return
    if (ownerType === 'driver') {
      if (kind === 'card') setUploadingCard(true)
      else setUploadingLicense(true)
    }
    try {
      const image = await sendImage(ownerType, editingId, kind, file)
      const setter = ownerType === 'driver' ? setForm : setFormGuarantor
      const fileSetter = ownerType === 'driver'
        ? (kind === 'card' ? setCardFile : setLicenseFile)
        : (kind === 'card' ? setGuarantorCardFile : setGuarantorLicenseFile)
      fileSetter(null)
      setter((current) => ({
        ...current,
        [kind === 'card' ? 'cardImageId' : 'licenseImageId']: image.id,
      }))
      updateDriverImageInState(editingId, ownerType, kind, image)
    } finally {
      if (ownerType === 'driver') {
        if (kind === 'card') setUploadingCard(false)
        else setUploadingLicense(false)
      }
    }
  }

  async function uploadPendingImages(ownerId: string) {
    const tasks: Array<Promise<void>> = []

    const enqueue = (ownerType: 'driver' | 'guarantor', kind: 'card' | 'license', file: File | null) => {
      if (!file) return
      tasks.push(
        sendImage(ownerType, ownerId, kind, file).then((image) => {
          if (ownerType === 'driver') {
            setForm((current) => ({
              ...current,
              [kind === 'card' ? 'cardImageId' : 'licenseImageId']: image.id,
            }))
          } else {
            setFormGuarantor((current) => ({
              ...current,
              [kind === 'card' ? 'cardImageId' : 'licenseImageId']: image.id,
            }))
          }
          updateDriverImageInState(ownerId, ownerType, kind, image)
        })
      )
    }

    enqueue('driver', 'card', cardFile)
    enqueue('driver', 'license', licenseFile)
    enqueue('guarantor', 'card', guarantorCardFile)
    enqueue('guarantor', 'license', guarantorLicenseFile)

    await Promise.all(tasks)
  }

  async function deleteImage(ownerType: 'driver' | 'guarantor', kind: 'card' | 'license') {
    if (!editingId) return
    const image =
      ownerType === 'driver'
        ? kind === 'card'
          ? editingDriver?.cardImage
          : editingDriver?.licenseImage
        : kind === 'card'
          ? guarantorImage?.cardImage
          : guarantorImage?.licenseImage
    if (!image) {
      if (ownerType === 'driver') {
        if (kind === 'card') setCardFile(null)
        else setLicenseFile(null)
      } else {
        if (kind === 'card') setGuarantorCardFile(null)
        else setGuarantorLicenseFile(null)
      }
      return
    }
    const res = await fetch(ownerType === 'driver' ? '/api/driver-images' : '/api/guarantor-images', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId: editingId, field: kind, imageId: image.id }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data?.error ?? 'ไม่สามารถลบรูปภาพได้')
      return
    }
    if (ownerType === 'driver') {
      if (kind === 'card') {
        setCardFile(null)
        setForm((current) => ({ ...current, cardImageId: null }))
      } else {
        setLicenseFile(null)
        setForm((current) => ({ ...current, licenseImageId: null }))
      }
    } else {
      if (kind === 'card') {
        setGuarantorCardFile(null)
        setFormGuarantor((current) => ({ ...current, cardImageId: null }))
      } else {
        setGuarantorLicenseFile(null)
        setFormGuarantor((current) => ({ ...current, licenseImageId: null }))
      }
    }
  }
  

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

    const newErrors: Record<string, string> = {}
    if (!form.fullName.trim()) newErrors.fullName = 'กรุณากรอกชื่อ-นามสกุล'
    if (!form.phone.trim()) newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์'

    if (Object.keys(newErrors).length > 0) {
      setErrorForm(newErrors)
      return
    }

    setErrorForm({})
    setError('')

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
      if (!editingId) {
        await uploadPendingImages(row.id)
      }
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
            
            {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

            <form className="mt-6 flex-1 space-y-6 overflow-auto pr-1" onSubmit={submitForm}>
              <div className='space-y-6'>
                <h3 className='text-xl font-extrabold text-slate-950'>ผู้เช่า</h3>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label htmlFor="fullName">ชื่อ-นามสกุล <span className="text-red-600">*</span></Label>
                    <Input id="fullName" maxLength={150} value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} />
                    {errorForm.fullName && (
                      <p className="mt-1 text-xs font-medium text-red-600">{errorForm.fullName}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="phone">เบอร์โทรศัพท์ <span className="text-red-600">*</span></Label>
                    <Input id="phone" maxLength={10} minLength={10} value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
                    {errorForm.phone && (
                      <p className="mt-1 text-xs font-medium text-red-600">{errorForm.phone}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="remark">หมายเหตุ</Label>
                    <Textarea id="remark" maxLength={500} value={form.remark ?? ''} onChange={(e) => updateField('remark', e.target.value)} />
                  </div>

                  <CardUploadImage
                    title="รูปบัตรประชาชน"
                    preview={cardPreview}
                    statusLabel={cardStatusLabel}
                    inputRef={cardInputRef}
                    onPick={() => triggerPicker('driver', 'card')}
                    onChange={(file) => setCardFile(file)}
                    onUpload={() => uploadImage('driver', 'card')}
                    onDelete={() => deleteImage('driver', 'card')}
                    uploading={uploadingCard}
                  />

                  <CardUploadImage
                    title="รูปใบขับขี่"
                    preview={licensePreview}
                    statusLabel={licenseStatusLabel}
                    inputRef={licenseInputRef}
                    onPick={() => triggerPicker('driver', 'license')}
                    onChange={(file) => setLicenseFile(file)}
                    onUpload={() => uploadImage('driver', 'license')}
                    onDelete={() => deleteImage('driver', 'license')}
                    uploading={uploadingLicense}
                  />
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

                  <CardUploadImage
                    title="รูปบัตรประชาชน"
                    preview={guarantorCardPreview}
                    statusLabel={guarantorCardStatusLabel}
                    inputRef={guarantorCardInputRef}
                    onPick={() => triggerPicker('guarantor', 'card')}
                    onChange={(file) => setGuarantorCardFile(file)}
                    onUpload={() => uploadImage('guarantor', 'card')}
                    onDelete={() => deleteImage('guarantor', 'card')}
                    uploading={false}
                    disabled={formGuarantor.fullName.trim() === '' || formGuarantor.phone.trim() === '' ? true : false}
                  />

                  <CardUploadImage
                    title="รูปใบขับขี่"
                    preview={guarantorLicensePreview}
                    statusLabel={guarantorLicenseStatusLabel}
                    inputRef={guarantorLicenseInputRef}
                    onPick={() => triggerPicker('guarantor', 'license')}
                    onChange={(file) => setGuarantorLicenseFile(file)}
                    onUpload={() => uploadImage('guarantor', 'license')}
                    onDelete={() => deleteImage('guarantor', 'license')}
                    uploading={false}
                    disabled={formGuarantor.fullName.trim() === '' || formGuarantor.phone.trim() === '' ? true : false}
                  />
                </div>
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
