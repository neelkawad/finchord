'use client'

import { formatCurrency, formatDate } from '@/lib/data'
import { useCategories, useMembers, useTransactions } from '@/lib/firestore-hooks'
import { MemberAvatar } from '@/components/ui/member-avatar'

export function SavingsBreakdown({ month }: { month: string }) {
  const { categories } = useCategories()
  const { members } = useMembers()
  const { transactions } = useTransactions()

  const thisMonth = transactions.filter((t) => t.date.slice(0, 7) === month)
  const expenses = thisMonth.filter((t) => t.type === 'expense')

  const savingsCategoryIds = new Set(categories.filter((c) => c.isSavings).map((c) => c.id))

  const savingsRows = expenses
    .filter((t) => t.categoryId && savingsCategoryIds.has(t.categoryId))
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <section aria-labelledby="savings-heading" className="flex h-full flex-col">
      <h2 id="savings-heading" className="mb-3 text-base font-semibold text-foreground">
        Savings
      </h2>
      <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-card">
        {savingsRows.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Nothing saved yet.</p>
        ) : (
          <ul className="divide-y divide-border">
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
        )}
      </div>
    </section>
  )
}
