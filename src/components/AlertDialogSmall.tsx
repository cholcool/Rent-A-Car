import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface AlertDialogSmallProps {
  title?: string | null
  description?: string | null
  open?: boolean
  setOpen?: (open: boolean) => void
}

export function AlertDialogSmall({ title, description, open, setOpen }: AlertDialogSmallProps) {
  function handleOpenChange(open: boolean) {
    if (setOpen) {
      setOpen(open)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Show Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogAction onClick={() => handleOpenChange(false)}>ปิดแจ้งเตือน</AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  )
}
