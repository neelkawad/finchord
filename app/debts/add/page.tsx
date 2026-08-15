import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AddDebtForm } from '@/components/debts/add-debt-form'
import { RequireParent } from '@/components/require-parent'

export default function AddDebtPage() {
  return (
    <RequireParent>
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
          <div>
            <Link
              href="/debts"
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Add debt</h1>
          </div>
          <AddDebtForm />
        </div>
      </main>
    </RequireParent>
  )
}
