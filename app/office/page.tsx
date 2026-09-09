'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { OfficeDaysTab } from '@/components/office/office-days-tab'
import { AppointmentsTab } from '@/components/office/appointments-tab'
import { DocumentsTab } from '@/components/office/documents-tab'
import { cn } from '@/lib/utils'

type Tab = 'appointments' | 'documents' | 'days'

export default function OfficePage() {
  const [tab, setTab] = useState<Tab>('days')

  return (
    <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <PageHeader title="Family Calendar" subtitle="Office days, appointments, and document expiries in one place." />

        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-card p-1">
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
          <button
            type="button"
            aria-pressed={tab === 'documents'}
            onClick={() => setTab('documents')}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === 'documents' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Documents
          </button>
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
        </div>

        {tab === 'appointments' ? <AppointmentsTab /> : tab === 'documents' ? <DocumentsTab /> : <OfficeDaysTab />}
      </div>
    </main>
  )
}
