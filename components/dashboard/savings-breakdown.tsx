'use client'

import { EyeOff } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/data'
import { useCategories, useMembers, useTransactions } from '@/lib/firestore-hooks'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { MagnitudeBarChart } from '@/components/dashboard/magnitude-bar-chart'

export function SavingsBreakdown({ month, show }: { month: string; show: boolean }) {
  const { categories } = useCategories()
  const { members } = useMembers()
  const { transactions } = useTransactions()

  const thisMonth = transactions.filter((t) => t.date.slice(0, 7) === month)
  const expenses = thisMonth.filter((t) => t.type === 'expense')

  const savingsCategoryIds = new Set(categories.filter((c) => c.isSavings).map((c) => c.id))

  const savingsRows = expenses
    .filter((t) => t.categoryId && savingsCategoryIds.has(t.categoryId))
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  const byCategory: Record<string, number> = {}
  for (const t of savingsRows) {
    const label = categories.find((c) => c.id === t.categoryId)?.name ?? 'Savings'
    byCategory[label] = (byCategory[label] ?? 0) + t.amount
  }
  const chartRows = Object.entries(byCategory)
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount)

  return (
    <section aria-labelledby="savings-heading" className="flex h-full flex-col">
      <div className="mb-3">
        <h2 id="savings-heading" className="text-base font-semibold text-foreground">
          Saved/Invested
        </h2>
      </div>
      <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-card">
        {!show ? (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
            <EyeOff className="size-5" />
            Hidden — tap the eye on the Saved/Invested card to reveal.
          </div>
        ) : savingsRows.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Nothing saved yet.</p>
        ) : (
          <>
            <div className="p-4 pb-0">
              <MagnitudeBarChart rows={chartRows} />
            </div>
            <ul className="mt-2 divide-y divide-border">
            {savingsRows.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId)
              const Icon = cat?.icon
              const m = members.find((mm) => mm.id === t.memberId)
              return (
                <li key={t.id} className="flex items-center gap-3 p-3.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-positive-muted text-positive">
                    {Icon && <Icon className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{t.merchant || cat?.name || 'Savings'}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {m && <MemberAvatar member={m} size="sm" className="size-4 text-[8px]" />}
                      {formatDate(t.date)}
                      {cat && t.merchant ? ` · ${cat.name}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(t.amount, { compact: true })}
                  </span>
                </li>
              )
            })}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}
