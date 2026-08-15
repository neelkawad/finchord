'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { AccountsView } from '@/components/accounts/accounts-view'
import { useAuth } from '@/lib/auth-context'
import { useSavingsAccounts } from '@/lib/firestore-hooks'
import { formatCurrency } from '@/lib/data'

export default function AccountsPage() {
  const router = useRouter()
  const { member, loading } = useAuth()
  const { savingsAccounts } = useSavingsAccounts()
  const totalSavings = savingsAccounts.reduce((sum, a) => sum + a.balance, 0)

  useEffect(() => {
    if (!loading && member && member.role !== 'parent') {
      router.replace('/')
    }
  }, [loading, member, router])

  if (loading || !member || member.role !== 'parent') {
    return null
  }

  return (
    <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader
          title="Retirement"
          subtitle={`${formatCurrency(totalSavings, { compact: true })} across savings & retirement accounts.`}
        />
        <AccountsView />
      </div>
    </main>
  )
}
