'use client'

import { ArrowDownCircle, EyeOff } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/data'
import { useMembers, useTransactions } from '@/lib/firestore-hooks'
import { useAuth } from '@/lib/auth-context'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { MagnitudeBarChart } from '@/components/dashboard/magnitude-bar-chart'

export function IncomeSources({ month, show }: { month: string; show: boolean }) {
  const { member } = useAuth()
  const canSeeIncomeDetail = member?.role === 'parent'
  const { members } = useMembers()
  const { transactions } = useTransactions()

  const rows = transactions
    .filter((t) => t.type === 'income' && t.date.slice(0, 7) === month)
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  const bySource: Record<string, number> = {}
  for (const t of rows) bySource[t.source ?? 'Other'] = (bySource[t.source ?? 'Other'] ?? 0) + t.amount
  const chartRows = Object.entries(bySource)
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount)

  return (
    <section aria-labelledby="income-heading" className="flex h-full flex-col">
      <div className="mb-3">
        <h2 id="income-heading" className="text-base font-semibold text-foreground">
          Income sources
        </h2>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
        {!canSeeIncomeDetail ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
            <EyeOff className="size-5" />
            Income details are only visible to parents.
          </div>
        ) : !show ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
            <EyeOff className="size-5" />
            Hidden — tap the eye on the Income card to reveal.
          </div>
        ) : rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No income logged yet.</p>
        ) : (
          <>
            <div className="p-4 pb-0">
              <MagnitudeBarChart rows={chartRows} />
            </div>
            <ul className="mt-2 divide-y divide-border">
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
          </>
        )}
      </div>
    </section>
  )
}
