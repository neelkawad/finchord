'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AddTransactionForm } from '@/components/transactions/add-transaction-form'
import { useTransactions } from '@/lib/firestore-hooks'
import { useAuth } from '@/lib/auth-context'

export default function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { transactions, loading } = useTransactions()
  const { member } = useAuth()
  const transaction = transactions.find((t) => t.id === id)

  const canEdit = member && transaction && (member.role === 'parent' || transaction.memberId === member.id)

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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Edit transaction</h1>
        </div>

        {loading ? null : !transaction ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Transaction not found.
          </p>
        ) : !canEdit ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            You can only edit your own transactions.
          </p>
        ) : (
          <AddTransactionForm transaction={transaction} />
        )}
      </div>
    </main>
  )
}
