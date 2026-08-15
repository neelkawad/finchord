'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { OverviewSummary } from '@/components/dashboard/overview-summary'
import { IncomeSources } from '@/components/dashboard/income-sources'
import { BudgetCategories } from '@/components/dashboard/budget-categories'
import { SavingsBreakdown } from '@/components/dashboard/savings-breakdown'
import { OverspendBanner } from '@/components/dashboard/overspend-banner'
import { MonthPicker } from '@/components/dashboard/month-picker'
import { useAuth } from '@/lib/auth-context'
import { currentMonthKey, daysLeftInMonth, formatMonthLabel } from '@/lib/data'

export default function DashboardPage() {
  const { member } = useAuth()
  const firstName = member?.name.split(' ')[0] ?? ''
  const [month, setMonth] = useState(currentMonthKey())

  const isCurrentMonth = month === currentMonthKey()
  const daysLeft = daysLeftInMonth(month)
  const subtitle = isCurrentMonth
    ? daysLeft === null || daysLeft <= 0
      ? "Here's how the Kawad household is doing this month."
      : `Here's how the Kawad household is doing this month. ${daysLeft} day${daysLeft === 1 ? '' : 's'} left.`
    : `Here's how the Kawad household did in ${formatMonthLabel(month)}.`

  return (
    <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader
          title={`Good to see you, ${firstName}`}
          subtitle={subtitle}
          action={<MonthPicker value={month} onChange={setMonth} />}
        />

        <OverviewSummary month={month} />

        <OverspendBanner month={month} />

        <div className="grid gap-6 sm:grid-cols-3">
          <IncomeSources month={month} />
          <BudgetCategories month={month} />
          <SavingsBreakdown month={month} />
        </div>
      </div>
    </main>
  )
}
