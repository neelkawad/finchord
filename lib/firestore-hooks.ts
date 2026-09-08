'use client'

import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { HOUSEHOLD_ID } from '@/lib/constants'
import { resolveIcon } from '@/lib/icon-map'
import { currentMonthKey, monthOptionsInRange } from '@/lib/data'
import type {
  Member,
  Category,
  Debt,
  Transaction,
  SavingsGoal,
  SavingsAccount,
  Asset,
  PassiveIncomeEntry,
  Appointment,
  InsurancePolicy,
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
              isFixed: (data.isFixed as boolean) ?? false,
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

// Month picker options bounded to real data — from the earliest transaction's
// month up to the current month, instead of a fixed lookback that offers
// empty months before the household had any data.
export function useMonthOptions() {
  const { transactions, loading } = useTransactions()

  const earliestMonth = transactions.reduce<string | null>((earliest, t) => {
    const month = t.date.slice(0, 7)
    return !earliest || month < earliest ? month : earliest
  }, null)

  const options = monthOptionsInRange(earliestMonth ?? currentMonthKey())

  return { options, loading }
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
    accountNumber: (d.accountNumber as string) || undefined,
    routingNumber: (d.routingNumber as string) || undefined,
    credentialsHint: (d.credentialsHint as string) || undefined,
  }))
  return { savingsAccounts: data, loading }
}

export function useAppointments() {
  const { data, loading } = useCollection<Appointment>('appointments', (id, d) => ({
    id,
    title: d.title as string,
    date: d.date as string,
    time: (d.time as string) || undefined,
    memberId: (d.memberId as string) || undefined,
    notes: (d.notes as string) || undefined,
    done: (d.done as boolean) ?? false,
  }))
  return { appointments: data, loading }
}

export function useInsurancePolicies() {
  const { data, loading } = useCollection<InsurancePolicy>('insurancePolicies', (id, d) => ({
    id,
    name: d.name as string,
    type: d.type as InsurancePolicy['type'],
    provider: d.provider as string,
    coverageAmount: (d.coverageAmount as number) ?? 0,
    premium: (d.premium as number) ?? 0,
    premiumFrequency: (d.premiumFrequency as InsurancePolicy['premiumFrequency']) ?? 'annual',
    renewalDate: (d.renewalDate as string) || undefined,
    beneficiary: (d.beneficiary as string) || undefined,
    policyNumber: (d.policyNumber as string) || undefined,
  }))
  return { insurancePolicies: data, loading }
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

export interface WatchdogDigest {
  month: string
  digest: string
  generatedAt: Date | null
}

export function useWatchdogDigest() {
  const [data, setData] = useState<WatchdogDigest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, 'households', HOUSEHOLD_ID, 'watchdog', 'latest')
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.data()
        setData(
          d
            ? {
                month: d.month as string,
                digest: d.digest as string,
                generatedAt: d.generatedAt?.toDate?.() ?? null,
              }
            : null,
        )
        setLoading(false)
      },
      () => setLoading(false),
    )
    return () => unsub()
  }, [])

  return { watchdog: data, loading }
}

export interface DayMeals {
  breakfastLunchbox: string
  lunchSnack: string
  dinner: string
}

export type MealPlan = Record<string, DayMeals>

export const MEAL_PLAN_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

export function emptyMealPlan(): MealPlan {
  const plan: MealPlan = {}
  for (const day of MEAL_PLAN_DAYS) plan[day] = { breakfastLunchbox: '', lunchSnack: '', dinner: '' }
  return plan
}

export interface ChoreItem {
  id: string
  text: string
  memberId?: string
  done: boolean
}

export type ChoreWeek = Record<string, ChoreItem[]>

export function emptyChoreWeek(): ChoreWeek {
  const week: ChoreWeek = {}
  for (const day of MEAL_PLAN_DAYS) week[day] = []
  return week
}

export function useChores() {
  const [data, setData] = useState<ChoreWeek | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, 'households', HOUSEHOLD_ID, 'chores', 'weekly')
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setData(snap.exists() ? (snap.data() as ChoreWeek) : null)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return () => unsub()
  }, [])

  return { chores: data, loading }
}

export const OFFICE_DAYS_TARGET = 12

export function useOfficeDays(month: string) {
  const [days, setDays] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, 'households', HOUSEHOLD_ID, 'officeDays', month)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data()
        setDays((data?.days as string[]) ?? [])
        setLoading(false)
      },
      () => setLoading(false),
    )
    return () => unsub()
  }, [month])

  return { officeDays: days, loading }
}

export function useMealPlan() {
  const [data, setData] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, 'households', HOUSEHOLD_ID, 'mealPlan', 'weekly')
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setData(snap.exists() ? (snap.data() as MealPlan) : null)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return () => unsub()
  }, [])

  return { mealPlan: data, loading }
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
