'use client'

import { Calendar, ChevronDown } from 'lucide-react'
import { monthOptions } from '@/lib/data'

export function MonthPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const options = monthOptions()

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-full border border-border bg-card py-2 pl-9 pr-9 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-ring focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}
