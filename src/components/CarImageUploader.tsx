'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Loader2, ImagePlus, ImageUp, BookImage, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AlertDialogDestructive } from '@/components/AlertDialogDestructive'
import imageCompression from 'browser-image-compression';

type ExistingImage = { id: string; url: string; name?: string | null }

interface Props {
  carId?: string
  initialImages?: ExistingImage[]
  onPendingFilesChange?: (files: File[]) => void
  className?: string
}

export default function CarImageUploader({ carId, initialImages = [], onPendingFilesChange, className }: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(initialImages)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setExistingImages(initialImages)
  }, [initialImages])

  useEffect(() => {
    onPendingFilesChange?.(selectedFiles)
  }, [onPendingFilesChange, selectedFiles])

  const [previews, setPreviews] = useState<Array<{ file: File; preview: string }>>([])

  useEffect(() => {
    const next = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPreviews(next)
    return () => {
      next.forEach(({ preview }) => URL.revokeObjectURL(preview))
    }
  }, [selectedFiles])

  const handleFileChange = async(files: FileList | null) => {
    if (!files?.length) return

    const fileArr = Array.from(files);

    const compressedArr = fileArr.map(async (item:any) => {
      const options = {
        maxSizeMB: 1,            // ขนาดไฟล์สูงสุดที่ต้องการ (เช่น ไม่เกิน 1MB)
        maxWidthOrHeight: 1024,  // ขนาดความกว้างหรือสูงสูงสุดไม่เกิน 1024px (รักษา Aspect Ratio อัตโนมัติ)
        useWebWorker: true,      // ใช้ Web Worker ทำงานเบื้องหลัง เพื่อไม่ให้หน้าจอค้างขณะบีบอัด
      };

      return await imageCompression(item, options);
    })

    const compressedFiles = await Promise.all(compressedArr)
    
    setError(null)
    setSelectedFiles((prev) => [...prev, ...compressedFiles])
  }

  const removeSelected = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExisting = async (imageId: string) => {
    const response = await fetch('/api/car-images', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId }),
    })
    if (!response.ok) {
      setError('ไม่สามารถลบรูปภาพได้')
      return
    }
    setExistingImages((prev) => prev.filter((item) => item.id !== imageId))
  }

  const uploadSelected = async () => {
    if (!carId) return
    if (selectedFiles.length === 0) return
    setIsUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('carId', carId)
      selectedFiles.forEach((file) => formData.append('files', file))

      const response = await fetch('/api/car-images', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Upload failed')
      }
      setSelectedFiles([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={className}>
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="mb-4 flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-700" />
            <h2 className="text-lg font-bold text-slate-950">รูปภาพรถ</h2>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <ImagePlus className="h-4 w-4" />
            เลือกรูป
            <input hidden type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e.target.files)} />
          </label>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        {existingImages.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {existingImages.map((image) => (
              <div key={image.id} className="group relative overflow-hidden rounded-xl border border-slate-200">
                <div className="relative aspect-4/3">
                  <Image src={image.url} alt={image.name ?? 'car image'} fill className="object-cover" />
                </div>
                <AlertDialogDestructive 
                  onClick={() => removeExisting(image.id)} 
                  variant={'imageDelete'} 
                  title='ต้องการลบรูปภาพนี้ใช่ไหม?'
                  description=''
                />
              </div>
            ))}
          </div>
        )}

        {previews.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {previews.map(({ file, preview }, index) => (
              <div key={`${file.name}-${index}`} className="relative overflow-hidden rounded-xl border border-slate-200">
                <div className="relative aspect-4/3">
                  <Image src={preview} alt={file.name} fill className="object-cover" />
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-white px-3 py-2 text-xs text-slate-600">
                  <span className="truncate">ตัวอย่างรูปภาพนี้ยังไม่ถูกอัพโหลด</span>
                  <button type="button" onClick={() => removeSelected(index)} className="font-semibold text-red-600">
                    ลบตัวอย่างรูป
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {existingImages.length === 0 && previews.length === 0 && (
          <div className="flex min-h-70 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
            <div className="text-center">
              <BookImage className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-500">ไม่มีรูปภาพ</p>
            </div>
          </div>
        )}

        {carId && (
          <Button type="button" onClick={uploadSelected} disabled={isUploading || selectedFiles.length === 0}>
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
            อัปโหลดรูปภาพ
          </Button>
        )}
      </div>
    </div>
  )
}
