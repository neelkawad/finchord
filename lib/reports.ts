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

export interface CategoryTrendSeries {
  id: string
  name: string
  totals: number[]
}

export interface CategoryTrend {
  months: string[]
  series: CategoryTrendSeries[]
}

const OTHER_SERIES_ID = '__other__'

// Buckets non-savings expenses by category across `months`, keeping only the
// `topN` categories by total spend over the window and folding the rest into
// an "Other" series — an unbounded per-category series count would make the
// chart unreadable once a household has 10+ categories.
export function computeCategoryTrend(
  transactions: Transaction[],
  categories: Category[],
  months: string[],
  topN = 5,
): CategoryTrend {
  const savingsCategoryIds = new Set(categories.filter((c) => c.isSavings).map((c) => c.id))
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]))

  const totalsByCategory = new Map<string, number[]>()
  for (const month of months) {
    const monthExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date.slice(0, 7) === month && !savingsCategoryIds.has(t.categoryId ?? ''),
    )
    for (const t of monthExpenses) {
      const id = t.categoryId ?? OTHER_SERIES_ID
      const monthIndex = months.indexOf(month)
      const arr = totalsByCategory.get(id) ?? months.map(() => 0)
      arr[monthIndex] += t.amount
      totalsByCategory.set(id, arr)
    }
  }

  const ranked = [...totalsByCategory.entries()].sort(
    (a, b) => b[1].reduce((s, n) => s + n, 0) - a[1].reduce((s, n) => s + n, 0),
  )

  const top = ranked.slice(0, topN)
  const rest = ranked.slice(topN)

  const series: CategoryTrendSeries[] = top.map(([id, totals]) => ({
    id,
    name: id === OTHER_SERIES_ID ? 'Uncategorized' : (categoryNames.get(id) ?? 'Unknown'),
    totals,
  }))

  if (rest.length > 0) {
    const otherTotals = months.map((_, i) => rest.reduce((s, [, totals]) => s + totals[i], 0))
    series.push({ id: 'other', name: 'Other', totals: otherTotals })
  }

  return { months, series }
}
