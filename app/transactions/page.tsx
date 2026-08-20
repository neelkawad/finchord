import { PageHeader } from '@/components/page-header'
import { AddTransactionButton, FloatingAddButton } from '@/components/add-transaction-button'
import { TransactionsView } from '@/components/transactions/transactions-view'

export default function TransactionsPage() {
  return (
    <main className="flex-1 px-4 pb-40 pt-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader
          title="Transactions"
          subtitle="Every purchase across the household, in one place."
          action={<AddTransactionButton className="hidden sm:inline-flex" />}
        />
        <TransactionsView />
      </div>
      <FloatingAddButton />
    </main>
  )
}
