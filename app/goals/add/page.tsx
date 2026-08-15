import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AddGoalForm } from '@/components/goals/add-goal-form'
import { RequireParent } from '@/components/require-parent'

export default function AddGoalPage() {
  return (
    <RequireParent>
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
          <div>
            <Link
              href="/goals"
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Add savings account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Track a savings or investment account for the household.</p>
          </div>
          <AddGoalForm />
        </div>
      </main>
    </RequireParent>
  )
}
