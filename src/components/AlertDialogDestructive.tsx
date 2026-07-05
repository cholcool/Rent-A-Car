import { 
  Trash2Icon, 
  TriangleAlert,
  CircleQuestionMark,
  BellCheck,
  ImageMinus
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button, AlertDialogVariant } from "@/components/ui"

interface AlertDialogDestructiveProps {
  onClick?: (e: any) => void
  title?: string
  description?: string
  variant?: AlertDialogVariant,
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg"
  iconText?: string
} 

function IconVariant({ variant }: { variant: AlertDialogVariant }) {
  switch (variant) {
    case 'destructive':
      return <Trash2Icon className="h-4 w-4 text-destructive" />
    case 'warning':
      return <TriangleAlert className="h-4 w-4 text-warning" />
    case 'notification':
      return <BellCheck className="h-4 w-4 text-notification" />
    case 'imageDelete':
      return <ImageMinus className="h-4 w-4 text-red-600" />
    default:
      return <CircleQuestionMark className="h-4 w-4 text-info" />
  }
}

function classAlertDialogMedia(variant: AlertDialogVariant) {
  switch (variant) {
    case 'destructive':
      return "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive"
    case 'warning':
      return "bg-amber-50 text-amber-700 hover:bg-amber-100 focus-visible:ring-amber-300 dark:bg-amber-100 dark:text-amber-800 dark:hover:bg-amber-200 dark:focus-visible:ring-amber-400"
    case 'notification':
      return "bg-amber-50 text-yellow-500 hover:bg-amber-100 focus-visible:ring-yellow-300 dark:bg-amber-100 dark:text-yellow-800 dark:hover:bg-amber-200 dark:focus-visible:ring-amber-400"
    case 'imageDelete':
      return "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive"
    default:
      return "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
  }
}

function buttonClass(variant: AlertDialogVariant) {
  switch (variant) {
    case 'imageDelete':
      return 'absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-600 shadow'
    default:
      return ''
  }
}
  
export function AlertDialogDestructive({ onClick, title, description, variant, size, iconText }: AlertDialogDestructiveProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" size={size || "icon-sm"} variant={variant} className={buttonClass(variant)}>
          <IconVariant variant={variant} /> 
          <span>{iconText || ''}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className={classAlertDialogMedia(variant)}>
            <IconVariant variant={variant} />
          </AlertDialogMedia>
          <AlertDialogTitle>{title || 'ต้องการลบข้อมูลนี้ใช่หรือไม่?'}</AlertDialogTitle>
          <AlertDialogDescription>
            {description || 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้? การกระทำนี้ไม่สามารถย้อนกลับได้.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">ยกเลิก</AlertDialogCancel>
          <AlertDialogAction variant={variant} onClick={(e) => { onClick?.(e) }}>ตกลง</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
