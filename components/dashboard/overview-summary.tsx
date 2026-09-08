'use client'

import { Eye, EyeOff } from 'lucide-react'
import { formatCurrency } from '@/lib/data'
import { useTransactions, useCategories } from '@/lib/firestore-hooks'
import { cn } from '@/lib/utils'

type Status = 'green' | 'amber' | 'red' | 'neutral'

const segmentClass: Record<Status, string> = {
  green: 'bg-positive',
  amber: 'bg-warning',
  red: 'bg-danger',
  neutral: 'bg-muted-foreground',
}

const textClass: Record<Status, string> = {
  green: 'text-positive',
  amber: 'text-warning',
  red: 'text-danger',
  neutral: 'text-foreground',
}

export function OverviewSummary({
  month,
  showIncome,
  onToggleIncome,
  showSaved,
  onToggleSaved,
}: {
  month: string
  showIncome: boolean
  onToggleIncome: () => void
  showSaved: boolean
  onToggleSaved: () => void
}) {
  const { transactions } = useTransactions()
  const { categories } = useCategories()
  const savingsCategoryIds = new Set(categories.filter((c) => c.isSavings).map((c) => c.id))

  const thisMonth = transactions.filter((t) => t.date.slice(0, 7) === month)
  const totalIncome = thisMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = thisMonth.filter((t) => t.type === 'expense')
  const totalSpent = expenses
    .filter((t) => !savingsCategoryIds.has(t.categoryId ?? ''))
    .reduce((s, t) => s + t.amount, 0)
  const saved = expenses.filter((t) => savingsCategoryIds.has(t.categoryId ?? '')).reduce((s, t) => s + t.amount, 0)

  const spentRatio = totalIncome > 0 ? totalSpent / totalIncome : 0
  const spentStatus: Status = totalIncome === 0 ? 'neutral' : spentRatio >= 0.5 ? 'red' : spentRatio >= 0.4 ? 'amber' : 'green'

  const spentNote =
    totalIncome === 0
      ? 'This month'
      : spentStatus === 'red'
        ? `Over 50% of income${showIncome ? ` (${Math.round(spentRatio * 100)}%)` : ''}`
        : spentStatus === 'amber'
          ? `Approaching 50% of income${showIncome ? ` (${Math.round(spentRatio * 100)}%)` : ''}`
          : showIncome
            ? `${Math.round(spentRatio * 100)}% of income`
            : 'This month'

  const outflow = totalSpent + saved
  const hasActivity = totalIncome > 0 || outflow > 0
  // Bar's 100% is whichever is larger — income, or what actually went out —
  // so an overspend month still renders sensibly instead of overflowing past 100%.
  const barTotal = Math.max(totalIncome, outflow, 1)
  const spentPct = (totalSpent / barTotal) * 100
  const savedPct = (saved / barTotal) * 100
  const remaining = totalIncome - outflow
  const remainingPct = remaining > 0 ? (remaining / barTotal) * 100 : 0
  const overPct = remaining < 0 ? (Math.abs(remaining) / barTotal) * 100 : 0

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="text-sm font-medium text-muted-foreground">Spent</span>
      <p className={cn('mt-2 text-3xl font-semibold tracking-tight', textClass[spentStatus])}>
        {formatCurrency(totalSpent, { compact: true })}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{spentNote}</p>

      {hasActivity ? (
        <>
          <div className="mt-4 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-accent">
            {spentPct > 0 && (
              <div className={cn('h-full rounded-full', segmentClass[spentStatus])} style={{ width: `${spentPct}%` }} />
            )}
            {savedPct > 0 && <div className="h-full rounded-full bg-positive/60" style={{ width: `${savedPct}%` }} />}
            {remainingPct > 0 && (
              <div className="h-full rounded-full bg-muted-foreground/30" style={{ width: `${remainingPct}%` }} />
            )}
            {overPct > 0 && <div className="h-full rounded-full bg-danger" style={{ width: `${overPct}%` }} />}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-foreground">
              <span className="size-1.5 shrink-0 rounded-full bg-positive-muted" />
              Income {showIncome ? formatCurrency(totalIncome, { compact: true }) : '••••'}
              <button
                type="button"
                onClick={onToggleIncome}
                aria-label={showIncome ? 'Hide income' : 'Show income'}
                aria-pressed={showIncome}
                className="text-muted-foreground hover:text-foreground"
              >
                {showIncome ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
              </button>
            </span>
            <span className="flex items-center gap-1.5 text-foreground">
              <span className="size-1.5 shrink-0 rounded-full bg-positive/60" />
              Saved {showSaved ? formatCurrency(saved, { compact: true }) : '••••'}
              <button
                type="button"
                onClick={onToggleSaved}
                aria-label={showSaved ? 'Hide savings' : 'Show savings'}
                aria-pressed={showSaved}
                className="text-muted-foreground hover:text-foreground"
              >
                {showSaved ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
              </button>
            </span>
            {remaining >= 0 ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/30" />
                Remaining {formatCurrency(remaining, { compact: true })}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-danger">
                <span className="size-1.5 shrink-0 rounded-full bg-danger" />
                {formatCurrency(Math.abs(remaining), { compact: true })} over
              </span>
            )}
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No transactions yet this month.</p>
      )}
    </div>
  )
}
