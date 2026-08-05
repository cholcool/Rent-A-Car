'use client'

import React from 'react'
import { cn } from '@/lib/utils'

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export default function Textarea({ className, required, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={cn(
        'block h-24 w-full rounded-xl border border-slate-200 px-3.5 text-sm font-medium text-slate-900 shadow-sm shadow-slate-200/50 outline-none transition-colors placeholder:text-slate-400 focus-visible:border-[#6F3BB7] focus-visible:ring-2 focus-visible:ring-[#6F3BB7]/20',
        required ? "bg-input/30" : "bg-white",
        className
      )}
    />
  )
}

export { Textarea }
