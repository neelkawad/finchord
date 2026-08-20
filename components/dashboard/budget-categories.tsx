'use client'

import type { LucideIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/data'
import { useCategories, useTransactions } from '@/lib/firestore-hooks'
import { resolveIcon } from '@/lib/icon-map'
import { matchCategoryGroup } from '@/lib/category-groups'

export function BudgetCategories({ month }: { month: string }) {
  const { categories } = useCategories()
  const { transactions } = useTransactions()

  const spentByCategory: Record<string, number> = {}
  for (const t of transactions) {
    if (t.type !== 'expense' || !t.categoryId) continue
    if (t.date.slice(0, 7) !== month) continue
    spentByCategory[t.categoryId] = (spentByCategory[t.categoryId] ?? 0) + t.amount
  }

  const withSpend = categories
    .filter((cat) => !cat.isSavings)
    .map((cat) => ({ ...cat, spent: spentByCategory[cat.id] ?? 0 }))
    .filter((cat) => cat.spent > 0)

  const grouped: Record<string, { label: string; icon: LucideIcon; amount: number }> = {}
  for (const cat of withSpend) {
    const match = matchCategoryGroup(cat.name)
    const key = match ? match.label : cat.name
    const icon = match ? resolveIcon(match.icon) : cat.icon
    if (!grouped[key]) grouped[key] = { label: key, icon, amount: 0 }
    grouped[key].amount += cat.spent
  }
  const rows = Object.values(grouped).sort((a, b) => b.amount - a.amount)
  const total = rows.reduce((s, r) => s + r.amount, 0)
  const maxAmount = rows.length > 0 ? rows[0].amount : 0

  return (
    <section aria-labelledby="category-heading" className="flex h-full flex-col">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="category-heading" className="text-base font-semibold text-foreground">
          Expenses by category
        </h2>
        <span className="text-sm font-medium text-muted-foreground">
          {formatCurrency(total, { compact: true })}
        </span>
      </div>
      <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-card">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No expenses yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => {
              const Icon = row.icon
              const pct = maxAmount > 0 ? (row.amount / maxAmount) * 100 : 0
              return (
                <li key={row.label} className="flex flex-col gap-2 p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-foreground">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{row.label}</span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(row.amount, { compact: true })}
                    </span>
                  </div>
                  <div className="ml-11 h-1.5 overflow-hidden rounded-full bg-accent">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
