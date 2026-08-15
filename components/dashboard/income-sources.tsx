'use client'

import { ArrowDownCircle, Wallet } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/data'
import { useCategories, useMembers, useTransactions } from '@/lib/firestore-hooks'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { cn } from '@/lib/utils'

export function IncomeSources({ month }: { month: string }) {
  const { members } = useMembers()
  const { categories } = useCategories()
  const { transactions } = useTransactions()

  const thisMonth = transactions.filter((t) => t.date.slice(0, 7) === month)
  const rows = thisMonth.filter((t) => t.type === 'income').sort((a, b) => (a.date < b.date ? 1 : -1))

  const savingsCategoryIds = new Set(categories.filter((c) => c.isSavings).map((c) => c.id))
  const totalIncome = rows.reduce((s, t) => s + t.amount, 0)
  const expenses = thisMonth.filter((t) => t.type === 'expense')
  const totalSpent = expenses
    .filter((t) => !savingsCategoryIds.has(t.categoryId ?? ''))
    .reduce((s, t) => s + t.amount, 0)
  const toSavings = expenses
    .filter((t) => savingsCategoryIds.has(t.categoryId ?? ''))
    .reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalSpent - toSavings

  return (
    <section aria-labelledby="income-heading" className="flex h-full flex-col">
      <h2 id="income-heading" className="mb-3 text-base font-semibold text-foreground">
        Income sources
      </h2>
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No income logged yet.</p>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {rows.map((t) => {
                const m = members.find((mm) => mm.id === t.memberId)
                return (
                  <li key={t.id} className="flex items-center gap-3 p-3.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-positive-muted text-positive">
                      <ArrowDownCircle className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{t.source ?? 'Other'}</p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {m && <MemberAvatar member={m} size="sm" className="size-4 text-[8px]" />}
                        {formatDate(t.date)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(t.amount, { compact: true })}
                    </span>
                  </li>
                )
              })}
            </ul>

            <div
              className={cn(
                'mt-auto flex items-center gap-3 border-t p-3.5',
                balance >= 0 ? 'border-dashed border-border bg-accent/30' : 'border-danger/30 bg-danger-muted',
              )}
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg',
                  balance >= 0 ? 'bg-accent text-foreground' : 'bg-danger-muted text-danger',
                )}
              >
                <Wallet className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm', balance >= 0 ? 'text-foreground' : 'font-medium text-danger')}>
                  Balance
                </p>
                <p className={cn('text-xs', balance >= 0 ? 'text-muted-foreground' : 'text-danger/80')}>
                  {balance >= 0 ? 'Uncommitted — may go toward debt payoff' : 'Expenses + savings exceeded income'}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 text-sm font-semibold tabular-nums',
                  balance >= 0 ? 'text-muted-foreground' : 'text-danger',
                )}
              >
                {balance >= 0 ? '' : '-'}
                {formatCurrency(Math.abs(balance), { compact: true })}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
