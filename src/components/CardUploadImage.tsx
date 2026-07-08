import Image from 'next/image'
import { Upload, Trash2, Plus } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { AlertDialogDestructive } from '@/components/AlertDialogDestructive'
import imageCompression from 'browser-image-compression';

type CardUploadImageProps = {
  title: string
  preview: string | null
  statusLabel: 'preview' | 'uploaded' | null
  inputRef: React.MutableRefObject<HTMLInputElement | null>
  onPick: () => void
  onChange: (file: File | null) => void
  onUpload: () => void
  onDelete: () => void
  uploading: boolean
  disabled?: boolean
}

export default function CardUploadImage({
  title,
  preview,
  statusLabel,
  inputRef,
  onPick,
  onChange,
  onUpload,
  onDelete,
  uploading,
  disabled,
}: CardUploadImageProps) {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const options = {
      maxSizeMB: 1,            // ขนาดไฟล์สูงสุดที่ต้องการ (เช่น ไม่เกิน 1MB)
      maxWidthOrHeight: 1024,  // ขนาดความกว้างหรือสูงสูงสุดไม่เกิน 1024px (รักษา Aspect Ratio อัตโนมัติ)
      useWebWorker: true,      // ใช้ Web Worker ทำงานเบื้องหลัง เพื่อไม่ให้หน้าจอค้างขณะบีบอัด
    };
    const file = event.target.files?.[0];
    if (!file) return null;
  
    try {
      const compressedFile = await imageCompression(file, options);
      
      // console.log('ขนาดไฟล์เดิม:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      // console.log('ขนาดไฟล์ใหม่:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
      // console.log('compressed:', compressedFile);
      // console.log('original:', file);
      
      onChange(compressedFile);
    } catch (error) {
      console.error('การบีบอัดรูปภาพผิดพลาด:', error);
      onChange(file);
    }
  };
  
  return (
    <div onClick={onPick} className="cursor-pointer rounded-2xl border border-slate-200 p-4 text-left transition hover:border-violet-300 hover:bg-violet-50/40">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-bold text-slate-950">{title}</div>
        {statusLabel === 'uploaded' ? (
          <Badge variant="success">อัปโหลดแล้ว</Badge>
        ) : statusLabel === 'preview' ? (
          <Badge variant="outline">ตัวอย่างรูป</Badge>
        ) : (
          <Badge variant="destructive">ยังไม่มี</Badge>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFileChange(event)}
        disabled={statusLabel !== null ? true : disabled}
      />
      <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-slate-100">
        {preview ? (
          <Image src={preview} alt={title} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <div className="text-center">
              <Plus className="mx-auto h-10 w-10" />
              <p className="mt-2 text-sm font-semibold">กดเพื่ออัปโหลดรูป</p>
            </div>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        {statusLabel === 'uploaded' ? (
          <AlertDialogDestructive 
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            variant={'destructive'} 
            title='ต้องการลบรูปนี้หรือไม่?'
            description='การลบรูปนี้จะไม่สามารถกู้คืนได้'
            size='lg'
            iconText='ลบรูปภาพ'
          />
        ) : statusLabel === 'preview' ? (
          <>
            <Button type="button" variant="save" size="sm" className="gap-2 px-6" onClick={(e) => { e.stopPropagation(); onUpload() }} disabled={uploading || !preview}>
              <Upload className="h-4 w-4" />
              {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
            </Button>
            <Button type="button" variant="destructive" size="sm" className="gap-2 px-6" onClick={(e) => { e.stopPropagation(); onDelete() }} disabled={!preview}>
              <Trash2 className="h-4 w-4" />
              ลบตัวอย่าง
            </Button>
          </>
        ) : (
          <Button type="button" variant="save" size="sm" className="gap-2 px-6" onClick={(e) => { e.stopPropagation(); onPick(); }}>
            <Plus className="h-4 w-4" />
            เลือกรูป
          </Button>
        )}
      </div>
    </div>
  )
}
