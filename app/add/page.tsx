import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AddTransactionForm } from '@/components/transactions/add-transaction-form'

export default function AddTransactionPage() {
  return (
    <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <div>
          <Link
            href="/transactions"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Add transaction</h1>
          <p className="mt-1 text-sm text-muted-foreground">Log a new purchase for the household.</p>
        </div>
        <AddTransactionForm />
      </div>
    </main>
  )
}
