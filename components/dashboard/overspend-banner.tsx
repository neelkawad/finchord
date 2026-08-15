'use client'

import { AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/data'
import { useCategories, useTransactions } from '@/lib/firestore-hooks'

export function OverspendBanner({ month }: { month: string }) {
  const { categories } = useCategories()
  const { transactions } = useTransactions()
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
  const overspend = totalSpent + toSavings - totalIncome

  if (overspend <= 0) return null

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger-muted p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger-muted text-danger">
        <AlertTriangle className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-danger">Overspent this month</p>
        <p className="text-xs text-danger/80">
          Expenses + savings exceeded income — covered by savings, credit, or last month&apos;s balance
        </p>
      </div>
      <span className="shrink-0 text-base font-semibold tabular-nums text-danger">
        -{formatCurrency(overspend, { compact: true })}
      </span>
    </div>
  )
}
