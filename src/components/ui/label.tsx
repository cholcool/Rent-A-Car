'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Label as LabelPrimitive } from "radix-ui"

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

export default function Label({ children, className = '', ...props }: LabelProps) {
  return (
    <label className={cn('mb-1.5 block text-sm font-semibold text-slate-800', className)} {...props}>
      {children}
    </label>
  )
}

function LabelRadix({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label, LabelRadix }
