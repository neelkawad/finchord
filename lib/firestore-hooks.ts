'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { HOUSEHOLD_ID } from '@/lib/constants'
import { resolveIcon } from '@/lib/icon-map'
import type {
  Member,
  Category,
  Debt,
  Transaction,
  SavingsGoal,
  SavingsAccount,
  Asset,
  PassiveIncomeEntry,
} from '@/lib/data'

function useCollection<T>(path: string, mapDoc: (id: string, data: Record<string, unknown>) => T) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = collection(db, 'households', HOUSEHOLD_ID, path)
    const unsub = onSnapshot(
      query(ref),
      (snap) => {
        setData(snap.docs.map((d) => mapDoc(d.id, d.data())))
        setLoading(false)
      },
      () => setLoading(false),
    )
    return () => unsub()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path])

  return { data, loading }
}

export function useMembers() {
  const { data, loading } = useCollection<Member>('members', (id, d) => ({
    id,
    name: d.name as string,
    role: d.role as Member['role'],
    initials: d.initials as string,
    color: d.color as string,
  }))
  return { members: data, loading }
}

export function useCategories() {
  const { data, loading } = useCollection<Category>('categories', (id, d) => ({
    id,
    name: d.name as string,
    icon: resolveIcon(d.icon as string | undefined),
    iconKey: (d.icon as string) ?? 'Wallet',
    isSavings: (d.isSavings as boolean) ?? false,
    spent: 0,
  }))
  return { categories: data, loading }
}

export function useDebts() {
  const { data, loading } = useCollection<Debt>('debts', (id, d) => ({
    id,
    name: d.name as string,
    group: (d.group as Debt['group']) ?? 'other',
    balance: (d.balance as number) ?? 0,
    interestRate: (d.interestRate as number) ?? 0,
  }))
  return { debts: data, loading }
}

export function useTransactions() {
  const [data, setData] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = collection(db, 'households', HOUSEHOLD_ID, 'transactions')
    const unsub = onSnapshot(
      query(ref, orderBy('date', 'desc')),
      (snap) => {
        setData(
          snap.docs.map((d) => {
            const data = d.data()
            return {
              id: d.id,
              type: (data.type as Transaction['type']) ?? 'expense',
              amount: data.amount as number,
              memberId: data.memberId as string,
              date: data.date as string,
              categoryId: (data.categoryId as string) || undefined,
              cardId: (data.cardId as string) || undefined,
              merchant: (data.merchant as string) || undefined,
              source: (data.source as string) || undefined,
            }
          }),
        )
        setLoading(false)
      },
      () => setLoading(false),
    )
    return () => unsub()
  }, [])

  return { transactions: data, loading }
}

export function useSavingsGoals() {
  const { data, loading } = useCollection<SavingsGoal>('goals', (id, d) => ({
    id,
    name: d.name as string,
    group: (d.group as SavingsGoal['group']) ?? 'savings',
    balance: (d.balance as number) ?? 0,
    targetBalance: (d.targetBalance as number) || undefined,
  }))
  return { savingsGoals: data, loading }
}

export function useCategoriesWithSpend() {
  const { categories, loading: categoriesLoading } = useCategories()
  const { transactions, loading: transactionsLoading } = useTransactions()

  const withSpend = categories.map((cat) => ({
    ...cat,
    spent: transactions
      .filter((t) => t.type === 'expense' && t.categoryId === cat.id)
      .reduce((sum, t) => sum + t.amount, 0),
  }))

  return { categories: withSpend, loading: categoriesLoading || transactionsLoading }
}

export function useSavingsAccounts() {
  const { data, loading } = useCollection<SavingsAccount>('savingsAccounts', (id, d) => ({
    id,
    name: d.name as string,
    type: d.type as SavingsAccount['type'],
    institution: d.institution as string,
    balance: (d.balance as number) ?? 0,
  }))
  return { savingsAccounts: data, loading }
}

export function useAssets() {
  const { data, loading } = useCollection<Asset>('assets', (id, d) => ({
    id,
    name: d.name as string,
    type: d.type as string,
    location: d.location as Asset['location'],
    value: (d.value as number) ?? 0,
    currency: d.currency as Asset['currency'],
  }))
  return { assets: data, loading }
}

export function usePassiveIncome() {
  const { data, loading } = useCollection<PassiveIncomeEntry>('passiveIncome', (id, d) => ({
    id,
    source: d.source as string,
    type: d.type as PassiveIncomeEntry['type'],
    amount: (d.amount as number) ?? 0,
    currency: 'INR',
    frequency: d.frequency as string,
  }))
  return { passiveIncome: data, loading }
}
