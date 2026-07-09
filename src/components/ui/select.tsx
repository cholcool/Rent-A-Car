"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "block h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm shadow-slate-200/50 outline-none transition-colors focus-visible:border-[#6F3BB7] focus-visible:ring-2 focus-visible:ring-[#6F3BB7]/20",
      className
    )}
    {...props}
  />
));

Select.displayName = "Select";

export default Select;
