import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AddSavingsForm } from '@/components/accounts/add-savings-form'
import { RequireParent } from '@/components/require-parent'

export default function AddSavingsPage() {
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
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Add account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Add a savings, retirement, education or health account.</p>
          </div>
          <AddSavingsForm />
        </div>
      </main>
    </RequireParent>
  )
}
