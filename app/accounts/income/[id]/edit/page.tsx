'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AddIncomeForm } from '@/components/accounts/add-income-form'
import { usePassiveIncome } from '@/lib/firestore-hooks'
import { RequireParent } from '@/components/require-parent'

export default function EditIncomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { passiveIncome, loading } = usePassiveIncome()
  const entry = passiveIncome.find((e) => e.id === id)

  return (
    <RequireParent>
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
          <div>
            <Link
              href="/accounts"
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Edit income entry</h1>
          </div>
          {loading ? null : !entry ? (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Entry not found.
            </p>
          ) : (
            <AddIncomeForm entry={entry} />
          )}
        </div>
      </main>
    </RequireParent>
  )
}
