'use client'

import { ArrowUpRight, Eye, EyeOff } from 'lucide-react'
import { formatCurrency } from '@/lib/data'
import { useTransactions, useCategories } from '@/lib/firestore-hooks'

type Status = 'green' | 'amber' | 'red' | 'neutral'

const iconClass: Record<Status, string> = {
  green: 'bg-positive-muted text-positive',
  amber: 'bg-warning-muted text-warning',
  red: 'bg-danger-muted text-danger',
  neutral: 'bg-accent text-foreground',
}

const textClass: Record<Status, string> = {
  green: 'text-positive',
  amber: 'text-warning',
  red: 'text-danger',
  neutral: 'text-foreground',
}

const meterFillClass: Record<Status, string> = {
  green: 'bg-positive',
  amber: 'bg-warning',
  red: 'bg-danger',
  neutral: 'bg-muted-foreground',
}

const meterTrackClass: Record<Status, string> = {
  green: 'bg-positive-muted',
  amber: 'bg-warning-muted',
  red: 'bg-danger-muted',
  neutral: 'bg-accent',
}

function Meter({ pct, status }: { pct: number; status: Status }) {
  return (
    <div className={`mt-2.5 h-1.5 w-full overflow-hidden rounded-full ${meterTrackClass[status]}`}>
      <div
        className={`h-full rounded-full ${meterFillClass[status]}`}
        style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
      />
    </div>
  )
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
  const toSavings = expenses
    .filter((t) => savingsCategoryIds.has(t.categoryId ?? ''))
    .reduce((s, t) => s + t.amount, 0)
  const saved = toSavings

  const spendingExpenses = expenses.filter((t) => !savingsCategoryIds.has(t.categoryId ?? ''))
  const fixedSpent = spendingExpenses.filter((t) => t.isFixed).reduce((s, t) => s + t.amount, 0)
  const flexibleSpent = spendingExpenses.filter((t) => !t.isFixed).reduce((s, t) => s + t.amount, 0)
  const fixedSpentPct = totalSpent > 0 ? (fixedSpent / totalSpent) * 100 : 0
  const flexibleSpentPct = totalSpent > 0 ? (flexibleSpent / totalSpent) * 100 : 0

  const spentRatio = totalIncome > 0 ? totalSpent / totalIncome : 0
  const spentStatus: Status =
    totalIncome === 0 ? 'neutral' : spentRatio >= 0.5 ? 'red' : spentRatio >= 0.4 ? 'amber' : 'green'

  const savedRatio = totalIncome > 0 ? saved / totalIncome : 0
  const savedStatus: Status = 'neutral'

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

  const savedNote =
    totalIncome === 0
      ? 'Moved to savings/investment categories'
      : showIncome && showSaved
        ? `${Math.round(savedRatio * 100)}% of income`
        : 'Moved to savings/investment categories'

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Income</span>
          <button
            type="button"
            onClick={onToggleIncome}
            aria-label={showIncome ? 'Hide income' : 'Show income'}
            aria-pressed={showIncome}
            className="flex size-8 items-center justify-center rounded-full bg-positive-muted text-positive transition-colors hover:bg-positive-muted/70"
          >
            {showIncome ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </button>
        </div>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          {showIncome ? formatCurrency(totalIncome, { compact: true }) : '••••••'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {showIncome ? 'This month' : 'Tap the eye to reveal'}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Spent</span>
          <span className={`flex size-8 items-center justify-center rounded-full ${iconClass[spentStatus]}`}>
            <ArrowUpRight className="size-4" />
          </span>
        </div>
        <p className={`mt-3 text-3xl font-semibold tracking-tight ${textClass[spentStatus]}`}>
          {formatCurrency(totalSpent, { compact: true })}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{spentNote}</p>
        {totalIncome > 0 && <Meter pct={spentRatio * 100} status={spentStatus} />}
        {totalSpent > 0 && (
          <div className="mt-3 rounded-lg bg-accent/60 p-2.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-foreground">
              <span className="flex items-center gap-1">
                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                Fixed {formatCurrency(fixedSpent, { compact: true })}
              </span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 shrink-0 rounded-full bg-primary/30" />
                Flexible {formatCurrency(flexibleSpent, { compact: true })}
              </span>
            </div>
            <div className="mt-1.5 flex h-1 gap-0.5 overflow-hidden rounded-full">
              <div className="h-full rounded-full bg-primary" style={{ width: `${fixedSpentPct}%` }} />
              <div className="h-full rounded-full bg-primary/30" style={{ width: `${flexibleSpentPct}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Saved/Invested</span>
          <button
            type="button"
            onClick={onToggleSaved}
            aria-label={showSaved ? 'Hide savings' : 'Show savings'}
            aria-pressed={showSaved}
            className={`flex size-8 items-center justify-center rounded-full transition-colors ${iconClass[savedStatus]}`}
          >
            {showSaved ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </button>
        </div>
        <p className={`mt-3 text-3xl font-semibold tracking-tight ${textClass[savedStatus]}`}>
          {showSaved ? `${saved >= 0 ? '' : '-'}${formatCurrency(Math.abs(saved), { compact: true })}` : '••••••'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{showSaved ? savedNote : 'Tap the eye to reveal'}</p>
        {totalIncome > 0 && showSaved && <Meter pct={savedRatio * 100} status="green" />}
      </div>
    </div>
  )
}
