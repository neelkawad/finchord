import type { Category, Transaction } from './data'

export interface MonthSummary {
  month: string
  totalIncome: number
  totalSpent: number
  toSavings: number
  balance: number
  incomeRows: Transaction[]
  expenseRows: Transaction[]
  savingsRows: Transaction[]
}

export function computeMonthSummary(
  transactions: Transaction[],
  categories: Category[],
  month: string,
): MonthSummary {
  const savingsCategoryIds = new Set(categories.filter((c) => c.isSavings).map((c) => c.id))
  const thisMonth = transactions.filter((t) => t.date.slice(0, 7) === month)

  const incomeRows = thisMonth.filter((t) => t.type === 'income').sort((a, b) => (a.date < b.date ? -1 : 1))
  const allExpenses = thisMonth.filter((t) => t.type === 'expense')
  const expenseRows = allExpenses
    .filter((t) => !savingsCategoryIds.has(t.categoryId ?? ''))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  const savingsRows = allExpenses
    .filter((t) => savingsCategoryIds.has(t.categoryId ?? ''))
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  const totalIncome = incomeRows.reduce((s, t) => s + t.amount, 0)
  const totalSpent = expenseRows.reduce((s, t) => s + t.amount, 0)
  const toSavings = savingsRows.reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalSpent - toSavings

  return { month, totalIncome, totalSpent, toSavings, balance, incomeRows, expenseRows, savingsRows }
}
