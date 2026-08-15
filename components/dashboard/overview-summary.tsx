'use client'

import { TrendingUp, ArrowDownRight, PiggyBank, Wallet } from 'lucide-react'
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

export function OverviewSummary({ month }: { month: string }) {
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

  const overspend = totalSpent + toSavings - totalIncome

  const spentRatio = totalIncome > 0 ? totalSpent / totalIncome : 0
  const spentStatus: Status =
    overspend > 0 ? 'red' : totalIncome === 0 ? 'neutral' : spentRatio >= 0.5 ? 'red' : spentRatio >= 0.4 ? 'amber' : 'green'

  const savedRatio = totalIncome > 0 ? saved / totalIncome : 0
  const savedStatus: Status = 'neutral'

  const spentNote =
    overspend > 0
      ? `Exceeded income by ${formatCurrency(overspend, { compact: true })}`
      : totalIncome === 0
        ? 'This month'
        : spentStatus === 'red'
          ? `Over 50% of income (${Math.round(spentRatio * 100)}%)`
          : spentStatus === 'amber'
            ? `Approaching 50% of income (${Math.round(spentRatio * 100)}%)`
            : `${Math.round(spentRatio * 100)}% of income`

  const savedNote =
    totalIncome === 0
      ? 'Moved to savings/investment categories'
      : `${Math.round(savedRatio * 100)}% of income`

  const balance = totalIncome - totalSpent - toSavings
  const balanceStatus: Status = totalIncome === 0 ? 'neutral' : balance >= 0 ? 'green' : 'red'
  const balanceNote =
    totalIncome === 0
      ? 'This month'
      : balance >= 0
        ? 'Uncommitted — may go toward debt payoff'
        : "Covered by savings, credit, or last month's balance"

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Income</span>
          <span className="flex size-8 items-center justify-center rounded-full bg-positive-muted text-positive">
            <TrendingUp className="size-4" />
          </span>
        </div>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          {formatCurrency(totalIncome, { compact: true })}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">This month</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Spent</span>
          <span className={`flex size-8 items-center justify-center rounded-full ${iconClass[spentStatus]}`}>
            <ArrowDownRight className="size-4" />
          </span>
        </div>
        <p className={`mt-3 text-3xl font-semibold tracking-tight ${textClass[spentStatus]}`}>
          {formatCurrency(totalSpent, { compact: true })}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{spentNote}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Saved</span>
          <span className={`flex size-8 items-center justify-center rounded-full ${iconClass[savedStatus]}`}>
            <PiggyBank className="size-4" />
          </span>
        </div>
        <p className={`mt-3 text-3xl font-semibold tracking-tight ${textClass[savedStatus]}`}>
          {saved >= 0 ? '' : '-'}
          {formatCurrency(Math.abs(saved), { compact: true })}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{savedNote}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Balance</span>
          <span className={`flex size-8 items-center justify-center rounded-full ${iconClass[balanceStatus]}`}>
            <Wallet className="size-4" />
          </span>
        </div>
        <p className={`mt-3 text-3xl font-semibold tracking-tight ${textClass[balanceStatus]}`}>
          {balance >= 0 ? '' : '-'}
          {formatCurrency(Math.abs(balance), { compact: true })}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{balanceNote}</p>
      </div>
    </div>
  )
}
