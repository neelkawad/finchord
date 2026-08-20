'use client'

import Link from 'next/link'
import { Plus, PiggyBank } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { RequireParent } from '@/components/require-parent'
import { formatCurrency, type SavingsGoal, type SavingsGoalGroup } from '@/lib/data'
import { useSavingsGoals } from '@/lib/firestore-hooks'
import { useAuth } from '@/lib/auth-context'

const groupMeta: { key: SavingsGoalGroup; title: string }[] = [
  { key: 'savings', title: 'Savings' },
  { key: 'investment', title: 'Investments' },
  { key: 'education', title: "Kids' Education" },
  { key: 'emergency', title: 'Emergency Fund' },
]

function SavingsList({ items, canEdit }: { items: SavingsGoal[]; canEdit: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <ul className="divide-y divide-border">
        {items.map((goal) => {
          const row = (
            <>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-positive-muted text-positive">
                <PiggyBank className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{goal.name}</p>
                <p className="text-xs text-muted-foreground">
                  {goal.targetBalance
                    ? `Target: ${formatCurrency(goal.targetBalance, { compact: true })}`
                    : 'No target set'}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(goal.balance, { compact: true })}
              </span>
            </>
          )
          return (
            <li key={goal.id}>
              {canEdit ? (
                <Link
                  href={`/goals/${goal.id}/edit`}
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

export default function GoalsPage() {
  const { savingsGoals } = useSavingsGoals()
  const { member } = useAuth()
  const canEdit = member?.role === 'parent'
  const totalBalance = savingsGoals.reduce((sum, g) => sum + g.balance, 0)

  return (
    <RequireParent>
    <main className="flex-1 px-4 pb-40 pt-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <PageHeader
          title="Savings Overview"
          subtitle={
            savingsGoals.length === 0
              ? 'No savings accounts tracked yet.'
              : `${formatCurrency(totalBalance, { compact: true })} across ${savingsGoals.length} ${savingsGoals.length === 1 ? 'account' : 'accounts'}.`
          }
          action={
            canEdit ? (
              <Link
                href="/goals/add"
                className="hidden items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:inline-flex"
              >
                <Plus className="size-4" />
                Add Savings
              </Link>
            ) : undefined
          }
        />

        {savingsGoals.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No savings accounts added yet.
          </p>
        ) : (
          groupMeta.map((section) => {
            const items = savingsGoals
              .filter((g) => g.group === section.key)
              .sort((a, b) => b.balance - a.balance)
            if (items.length === 0) return null
            return (
              <section key={section.key} aria-labelledby={`section-${section.key}`}>
                <h2 id={`section-${section.key}`} className="mb-3 text-base font-semibold text-foreground">
                  {section.title}
                </h2>
                <SavingsList items={items} canEdit={canEdit} />
              </section>
            )
          })
        )}
      </div>
      {canEdit && <FloatingActionButton href="/goals/add" label="Add savings" />}
    </main>
    </RequireParent>
  )
}
