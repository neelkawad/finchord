'use client'

import Link from 'next/link'
import { Plus, Landmark } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { formatCurrency, type Debt, type DebtGroup } from '@/lib/data'
import { useDebts } from '@/lib/firestore-hooks'
import { useAuth } from '@/lib/auth-context'

const groupMeta: { key: DebtGroup; title: string }[] = [
  { key: 'home', title: 'Home' },
  { key: 'auto', title: 'Auto' },
  { key: 'credit', title: 'Credit Cards' },
  { key: 'other', title: 'Other' },
]

function DebtList({ items, canEdit }: { items: Debt[]; canEdit: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <ul className="divide-y divide-border">
        {items.map((debt) => {
          const row = (
            <>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-foreground">
                <Landmark className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{debt.name}</p>
                <p className="text-xs text-muted-foreground">{debt.interestRate}% interest</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(debt.balance, { compact: true })}
              </span>
            </>
          )
          return (
            <li key={debt.id}>
              {canEdit ? (
                <Link
                  href={`/debts/${debt.id}/edit`}
                  className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/50"
                >
                  {row}
                </Link>
              ) : (
                <div className="flex items-center gap-3 p-4">{row}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function DebtsPage() {
  const { debts } = useDebts()
  const { member } = useAuth()
  const canEdit = member?.role === 'parent'
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0)

  return (
    <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <PageHeader
          title="Debt Overview"
          subtitle={
            debts.length === 0
              ? 'No debts tracked yet.'
              : `${formatCurrency(totalDebt, { compact: true })} owed across ${debts.length} ${debts.length === 1 ? 'debt' : 'debts'}.`
          }
          action={
            canEdit ? (
              <Link
                href="/debts/add"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Plus className="size-4" />
                Add Debt
              </Link>
            ) : undefined
          }
        />

        {debts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No debts added yet.
          </p>
        ) : (
          groupMeta.map((section) => {
            const items = debts
              .filter((d) => d.group === section.key)
              .sort((a, b) => b.balance - a.balance)
            if (items.length === 0) return null
            const sectionTotal = items.reduce((sum, d) => sum + d.balance, 0)
            return (
              <section key={section.key} aria-labelledby={`section-${section.key}`}>
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 id={`section-${section.key}`} className="text-base font-semibold text-foreground">
                    {section.title}
                  </h2>
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatCurrency(sectionTotal, { compact: true })}
                  </span>
                </div>
                <DebtList items={items} canEdit={canEdit} />
              </section>
            )
          })
        )}
      </div>
    </main>
  )
}
