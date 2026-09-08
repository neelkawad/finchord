'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { WeeklyPlanTab } from '@/components/meals/weekly-plan-tab'
import { GroceryListTab } from '@/components/meals/grocery-list-tab'
import { ChoresTab } from '@/components/meals/chores-tab'
import { cn } from '@/lib/utils'

type Tab = 'plan' | 'grocery' | 'chores'

export default function MealsPage() {
  const [tab, setTab] = useState<Tab>('plan')

  return (
    <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <PageHeader
          title="Meal Plan"
          subtitle="The same plan every week — set it once, nobody has to ask what's for dinner."
        />

        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-card p-1">
          <button
            type="button"
            aria-pressed={tab === 'plan'}
            onClick={() => setTab('plan')}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === 'plan' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Weekly Plan
          </button>
          <button
            type="button"
            aria-pressed={tab === 'grocery'}
            onClick={() => setTab('grocery')}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === 'grocery' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Grocery List
          </button>
          <button
            type="button"
            aria-pressed={tab === 'chores'}
            onClick={() => setTab('chores')}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === 'chores' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Chores
          </button>
        </div>

        {tab === 'plan' ? <WeeklyPlanTab /> : tab === 'grocery' ? <GroceryListTab /> : <ChoresTab />}
      </div>
    </main>
  )
}
