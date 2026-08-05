import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toDatetimeLocal(value?: string | Date | null) {
  if (!value) return ''
  const d = new Date(value)
  const tzOffset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
}

export function toDateInputValue(value: string) {
  return value ? value.slice(0, 10) : ''
}

export function formatePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10) {///092-264-4346
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return digits
}

export function formateCardNo(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 13) {///เลขบัตรประชาชน 1-2345-67890-12-3
    return `${digits.slice(0,1)}-${digits.slice(1,5)}-${digits.slice(5,10)}-${digits.slice(10,12)}-${digits.slice(12)}`
  }
  return digits
}