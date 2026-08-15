import type { LucideIcon } from 'lucide-react'

export type Role = 'parent' | 'kid'

export interface Member {
  id: string
  name: string
  role: Role
  initials: string
  color: string
}

export interface Category {
  id: string
  name: string
  icon: LucideIcon
  iconKey: string
  isSavings: boolean
  spent: number
}

export type DebtGroup = 'home' | 'auto' | 'credit' | 'other'

export interface Debt {
  id: string
  name: string
  group: DebtGroup
  balance: number
  interestRate: number
}

export type TransactionType = 'expense' | 'income'

export const incomeSources = ['Salary', 'Allowance', 'Bonus', 'Gift', 'Other']

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  memberId: string
  date: string
  categoryId?: string
  cardId?: string
  merchant?: string
  source?: string
}

export type SavingsGoalGroup = 'savings' | 'education' | 'emergency'

export interface SavingsGoal {
  id: string
  name: string
  group: SavingsGoalGroup
  balance: number
  targetBalance?: number
}

export type AccountType = 'savings' | 'retirement' | 'education' | 'health'

export interface SavingsAccount {
  id: string
  name: string
  type: AccountType
  institution: string
  balance: number
}

export type AssetLocation = 'US' | 'India'

export interface Asset {
  id: string
  name: string
  type: string
  location: AssetLocation
  value: number
  currency: 'USD' | 'INR'
}

export interface PassiveIncomeEntry {
  id: string
  source: string
  type: 'Rental' | 'Interest'
  amount: number
  currency: 'INR'
  frequency: string
}

export function formatCurrency(amount: number, opts?: { compact?: boolean }) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: opts?.compact ? 0 : 2,
    maximumFractionDigits: opts?.compact ? 0 : 2,
  }).format(amount)
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function currentMonthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function formatMonthLabel(monthKey: string) {
  const [y, m] = monthKey.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function daysLeftInMonth(monthKey: string): number | null {
  if (monthKey !== currentMonthKey()) return null
  const [y, m] = monthKey.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return lastDay - new Date().getDate()
}

export function monthOptions(count = 12) {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { value, label: formatMonthLabel(value) }
  })
}

