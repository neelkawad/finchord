'use client'

import { PageHeader } from '@/components/page-header'
import { HealthView } from '@/components/health/health-view'
import { RequireParent } from '@/components/require-parent'

export default function HealthPage() {
  return (
    <RequireParent>
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <PageHeader title="Health" subtitle="Height and weight over time, per family member." />
          <HealthView />
        </div>
      </main>
    </RequireParent>
  )
}
