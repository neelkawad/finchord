'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { OfficeDaysTab } from '@/components/office/office-days-tab'
import { AppointmentsTab } from '@/components/office/appointments-tab'
import { cn } from '@/lib/utils'

type Tab = 'days' | 'appointments'

export default function OfficePage() {
  const [tab, setTab] = useState<Tab>('days')

  return (
    <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <PageHeader title="Office Days" subtitle="Track office days, and keep family appointments in one place." />

        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-1">
          <button
            type="button"
            aria-pressed={tab === 'days'}
            onClick={() => setTab('days')}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === 'days' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Office Days
          </button>
          <button
            type="button"
            aria-pressed={tab === 'appointments'}
            onClick={() => setTab('appointments')}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === 'appointments' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Appointments
          </button>
        </div>

        {tab === 'days' ? <OfficeDaysTab /> : <AppointmentsTab />}
      </div>
    </main>
  )
}
