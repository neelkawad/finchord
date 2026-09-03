'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { SlidersHorizontal, X, ArrowDownCircle, ChevronDown, Repeat } from 'lucide-react'
import { currentMonthKey, formatCurrency, formatDate, formatMonthLabel, type TransactionType } from '@/lib/data'
import { useMembers, useCategories, useDebts, useTransactions } from '@/lib/firestore-hooks'
import { SelectField, type Option } from '@/components/ui/select-field'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { RecurringSuggestions } from '@/components/transactions/recurring-suggestions'
import { cn } from '@/lib/utils'

type RangeKey = 'all' | '7' | '30'
type TypeFilter = 'all' | TransactionType | 'savings' | 'fixed' | 'flexible'

const rangeOptions: Option[] = [
  { value: 'all', label: 'All dates' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
]

const typeOptions: Option[] = [
  { value: 'all', label: 'All' },
  { value: 'income', label: 'Income only' },
  { value: 'fixed', label: 'Fixed expenses only' },
  { value: 'flexible', label: 'Flexible expenses only' },
  { value: 'savings', label: 'Savings only' },
]

export function TransactionsView() {
  const { members } = useMembers()
  const { categories } = useCategories()
  const { debts } = useDebts()
  const cards = debts.filter((d) => d.group === 'credit')
  const { transactions } = useTransactions()
  const savingsCategoryIds = useMemo(
    () => new Set(categories.filter((c) => c.isSavings).map((c) => c.id)),
    [categories],
  )

  const [member, setMember] = useState('all')
  const [category, setCategory] = useState('all')
  const [card, setCard] = useState('all')
  const [type, setType] = useState<TypeFilter>('all')
  const [range, setRange] = useState<RangeKey>('all')
  const [showFilters, setShowFilters] = useState(false)

  const memberOptions: Option[] = [
    { value: 'all', label: 'All members' },
    ...members.map((m) => ({ value: m.id, label: m.name.split(' ')[0] })),
  ]
  const categoryOptions: Option[] = [
    { value: 'all', label: 'All categories' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]
  const cardOptions: Option[] = [
    { value: 'all', label: 'All cards' },
    ...cards.map((c) => ({ value: c.id, label: c.name })),
  ]

  const today = useMemo(() => new Date(), [])

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (member !== 'all' && t.memberId !== member) return false
      if (category !== 'all' && t.categoryId !== category) return false
      if (card !== 'all' && t.cardId !== card) return false
      const isSavingsTxn = t.type === 'expense' && savingsCategoryIds.has(t.categoryId ?? '')
      const isSpendingTxn = t.type === 'expense' && !isSavingsTxn
      if (type === 'income' && t.type !== 'income') return false
      if (type === 'expense' && !isSpendingTxn) return false
      if (type === 'fixed' && !(isSpendingTxn && t.isFixed)) return false
      if (type === 'flexible' && !(isSpendingTxn && !t.isFixed)) return false
      if (type === 'savings' && !isSavingsTxn) return false
      if (range !== 'all') {
        const days = Number(range)
        const diff = (today.getTime() - new Date(t.date + 'T00:00:00').getTime()) / 86400000
        if (diff > days) return false
      }
      return true
    })
  }, [transactions, member, category, card, type, range, today, savingsCategoryIds])

  const monthGroups = useMemo(() => {
    const groups = new Map<string, typeof filtered>()
    for (const t of filtered) {
      const month = t.date.slice(0, 7)
      if (!groups.has(month)) groups.set(month, [])
      groups.get(month)!.push(t)
    }
    return Array.from(groups.entries()).map(([month, items]) => ({ month, items }))
  }, [filtered])

  const [toggledMonths, setToggledMonths] = useState<Set<string>>(new Set())
  const toggleMonth = (month: string) => {
    setToggledMonths((prev) => {
      const next = new Set(prev)
      if (next.has(month)) next.delete(month)
      else next.add(month)
      return next
    })
  }

  // Totals reflect the current month only — the list below still shows every
  // month (grouped, collapsible), but an all-time total here isn't useful.
  const currentMonthFiltered = useMemo(
    () => filtered.filter((t) => t.date.slice(0, 7) === currentMonthKey()),
    [filtered],
  )
  const totalIncome = currentMonthFiltered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenseTxns = currentMonthFiltered.filter((t) => t.type === 'expense')
  const totalExpense = expenseTxns
    .filter((t) => !savingsCategoryIds.has(t.categoryId ?? ''))
    .reduce((s, t) => s + t.amount, 0)
  const totalSavings = expenseTxns
    .filter((t) => savingsCategoryIds.has(t.categoryId ?? ''))
    .reduce((s, t) => s + t.amount, 0)
  const net = totalIncome - totalExpense - totalSavings

  const activeFilters =
    (member !== 'all' ? 1 : 0) +
    (category !== 'all' ? 1 : 0) +
    (card !== 'all' ? 1 : 0) +
    (type !== 'all' ? 1 : 0) +
    (range !== 'all' ? 1 : 0)

  const clearAll = () => {
    setMember('all')
    setCategory('all')
    setCard('all')
    setType('all')
    setRange('all')
  }

  return (
    <div className="flex flex-col gap-4">
      <RecurringSuggestions transactions={transactions} />

      {/* Filter bar */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center gap-2 text-sm font-medium text-foreground md:cursor-default"
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {activeFilters > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {activeFilters}
              </span>
            )}
          </button>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
              Clear
            </button>
          )}
        </div>
        <div
          className={cn(
            'mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5',
            showFilters ? 'grid' : 'hidden md:grid',
          )}
        >
          <SelectField label="Type" value={type} onChange={(v) => setType(v as TypeFilter)} options={typeOptions} />
          <SelectField label="Member" value={member} onChange={setMember} options={memberOptions} />
          <SelectField label="Category" value={category} onChange={setCategory} options={categoryOptions} />
          <SelectField label="Card" value={card} onChange={setCard} options={cardOptions} />
          <SelectField label="Date range" value={range} onChange={(v) => setRange(v as RangeKey)} options={rangeOptions} />
        </div>
      </div>

      {/* Summary line */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-sm">
        <span className="text-muted-foreground">
          {currentMonthFiltered.length} {currentMonthFiltered.length === 1 ? 'transaction' : 'transactions'} this month
        </span>
        <div className="flex items-center gap-4">
          <span className="text-positive">
            +{formatCurrency(totalIncome, { compact: true })}
          </span>
          <span className="text-foreground">
            -{formatCurrency(totalExpense, { compact: true })}
          </span>
          {totalSavings > 0 && (
            <span className="text-positive">
              +{formatCurrency(totalSavings, { compact: true })} saved
            </span>
          )}
          <span className="font-medium text-foreground">
            Net: <span className="tabular-nums">{net >= 0 ? '+' : ''}{formatCurrency(net, { compact: true })}</span>
          </span>
        </div>
      </div>

      {/* List, grouped by month and collapsible */}
      {filtered.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {transactions.length === 0
              ? 'No transactions logged yet — add your first one.'
              : 'No transactions match these filters.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {monthGroups.map(({ month, items }, index) => {
            const defaultExpanded = index === 0
            const expanded = toggledMonths.has(month) ? !defaultExpanded : defaultExpanded
            return (
              <div key={month} className="overflow-hidden rounded-2xl border border-border bg-card">
                <button
                  type="button"
                  onClick={() => toggleMonth(month)}
                  aria-expanded={expanded}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-accent/50"
                >
                  <span className="text-sm font-semibold text-foreground">{formatMonthLabel(month)}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {items.length} {items.length === 1 ? 'transaction' : 'transactions'}
                    <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} />
                  </span>
                </button>
                {expanded && (
                  <ul className="divide-y divide-border border-t border-border">
                    {items.map((t) => {
                      const isIncome = t.type === 'income'
                      const cat = categories.find((c) => c.id === t.categoryId)
                      const isSavingsExpense = !isIncome && !!cat?.isSavings
                      const isPositive = isIncome || isSavingsExpense
                      const m = members.find((mm) => mm.id === t.memberId)
                      const c = cards.find((cc) => cc.id === t.cardId)
                      const Icon = isIncome ? ArrowDownCircle : cat?.icon
                      return (
                        <li key={t.id}>
                          <Link
                            href={`/transactions/${t.id}/edit`}
                            className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent/50"
                          >
                            <span
                              className={cn(
                                'flex size-10 shrink-0 items-center justify-center rounded-full',
                                isPositive ? 'bg-positive-muted text-positive' : 'bg-danger-muted text-danger',
                              )}
                            >
                              {Icon && <Icon className="size-[18px]" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {isIncome ? t.source : t.merchant || cat?.name || 'Transaction'}
                              </p>
                              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                                {isIncome ? 'Income' : (cat?.name ?? 'Uncategorized')}
                                {!isIncome && c ? ` · ${c.name}` : ''}
                                {!isIncome && t.isFixed && <Repeat className="size-3 shrink-0" />}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span
                                className={cn(
                                  'text-sm font-semibold tabular-nums',
                                  isPositive ? 'text-positive' : 'text-danger',
                                )}
                              >
                                {isIncome ? '+' : isSavingsExpense ? '+' : '-'}
                                {formatCurrency(t.amount)}
                              </span>
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                {m && <MemberAvatar member={m} size="sm" className="size-5 text-[9px]" />}
                                {formatDate(t.date)}
                              </span>
                            </div>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
