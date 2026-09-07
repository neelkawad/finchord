'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { HOUSEHOLD_ID } from '@/lib/constants'
import { MonthPicker } from '@/components/dashboard/month-picker'
import { useOfficeDays, OFFICE_DAYS_TARGET } from '@/lib/firestore-hooks'
import { currentMonthKey, formatMonthLabel } from '@/lib/data'
import { cn } from '@/lib/utils'

const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

// Office Days launched August 2026 — no point offering earlier, empty months.
const FEATURE_START_MONTH = '2026-08'

function officeMonthOptions() {
  const [startYear, startMonth] = FEATURE_START_MONTH.split('-').map(Number)
  const [nowYear, nowMonth] = currentMonthKey().split('-').map(Number)
  const totalMonths = (nowYear - startYear) * 12 + (nowMonth - startMonth) + 1

  return Array.from({ length: Math.max(totalMonths, 1) }, (_, i) => {
    const d = new Date(nowYear, nowMonth - 1 - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { value, label: formatMonthLabel(value) }
  })
}

function buildCalendarCells(month: string) {
  const [year, monthNum] = month.split('-').map(Number)
  const firstDayOfWeek = new Date(year, monthNum - 1, 1).getDay()
  const daysInMonth = new Date(year, monthNum, 0).getDate()

  const cells: (string | null)[] = Array(firstDayOfWeek).fill(null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(`${month}-${String(day).padStart(2, '0')}`)
  }
  return cells
}

export function OfficeDaysTab() {
  const [month, setMonth] = useState(currentMonthKey())
  const { officeDays, loading } = useOfficeDays(month)

  const toggleDay = async (date: string) => {
    const next = officeDays.includes(date) ? officeDays.filter((d) => d !== date) : [...officeDays, date]
    await setDoc(doc(db, 'households', HOUSEHOLD_ID, 'officeDays', month), { days: next })
  }

  const count = officeDays.length
  const pct = Math.min((count / OFFICE_DAYS_TARGET) * 100, 100)
  const metTarget = count >= OFFICE_DAYS_TARGET

  const cells = buildCalendarCells(month)

  if (loading) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <MonthPicker value={month} onChange={setMonth} options={officeMonthOptions()} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">This month</span>
          {metTarget && (
            <span className="flex items-center gap-1 text-sm font-medium text-positive">
              <Check className="size-4" />
              Target met
            </span>
          )}
        </div>
        <p className={cn('mt-2 text-5xl font-semibold tracking-tight', metTarget ? 'text-positive' : 'text-foreground')}>
          {count} <span className="text-2xl font-medium text-muted-foreground">/ {OFFICE_DAYS_TARGET} days</span>
        </p>
        {!metTarget && (
          <p className="mt-1 text-sm text-muted-foreground">
            {OFFICE_DAYS_TARGET - count} more day{OFFICE_DAYS_TARGET - count === 1 ? '' : 's'} needed
          </p>
        )}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-accent">
          <div
            className={cn('h-full rounded-full', metTarget ? 'bg-positive' : 'bg-primary')}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {weekdayLabels.map((label, i) => (
            <div key={i}>{label}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <div key={`blank-${i}`} />
            const day = Number(date.slice(-2))
            const active = officeDays.includes(date)
            return (
              <button
                key={date}
                type="button"
                aria-pressed={active}
                onClick={() => toggleDay(date)}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-lg text-sm font-medium transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent',
                )}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
