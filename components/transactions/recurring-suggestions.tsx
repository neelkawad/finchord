'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Repeat } from 'lucide-react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { HOUSEHOLD_ID } from '@/lib/constants'
import { formatMonthLabel, currentMonthKey, type Transaction } from '@/lib/data'
import { useCategories, useMembers } from '@/lib/firestore-hooks'
import { cn } from '@/lib/utils'

function previousMonthKey(monthKey: string) {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Maps a day-of-month from last month onto the current month, clamped so
// e.g. day 31 in a 30-day month doesn't overflow into next month.
function dateInMonth(monthKey: string, day: number) {
  const [y, m] = monthKey.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return `${monthKey}-${String(Math.min(day, lastDay)).padStart(2, '0')}`
}

// Expenses dedupe by category+merchant (a fixed bill occurs once a month).
// Income does NOT dedupe by source alone — semi-monthly/biweekly pay means
// the same source can legitimately appear 2-3 times a month on different days.
function candidateKey(t: Transaction) {
  const day = Number(t.date.slice(-2))
  return t.type === 'income' ? `income|${t.source}|${day}` : `expense|${t.categoryId}|${t.merchant}`
}

export function RecurringSuggestions({ transactions }: { transactions: Transaction[] }) {
  const { categories } = useCategories()
  const { members } = useMembers()
  const [reviewing, setReviewing] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [dates, setDates] = useState<Record<string, string>>({})
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  const thisMonth = currentMonthKey()
  const lastMonth = previousMonthKey(thisMonth)

  const candidates = useMemo(() => {
    const lastMonthTxns = transactions.filter((t) => t.date.slice(0, 7) === lastMonth)
    const thisMonthTxns = transactions.filter((t) => t.date.slice(0, 7) === thisMonth)
    const thisMonthKeys = new Set(thisMonthTxns.map(candidateKey))
    const today = new Date().getDate()

    const seen = new Set<string>()
    return lastMonthTxns
      // Income defaults to recurring for entries logged before the frequency
      // toggle existed — only an explicit "One-time" (isFixed === false) opts out.
      .filter((t) => (t.type === 'income' ? t.isFixed !== false : t.isFixed))
      .filter((t) => {
        const key = candidateKey(t)
        if (thisMonthKeys.has(key) || seen.has(key)) return false
        // Recurring items reuse last month's day-of-month as their due day —
        // don't surface a bill for review until that day actually arrives,
        // instead of dumping every fixed item on the 1st.
        if (today < Number(t.date.slice(-2))) return false
        seen.add(key)
        return true
      })
  }, [transactions, lastMonth, thisMonth])

  useEffect(() => {
    if (candidates.length && selected.size === 0 && Object.keys(amounts).length === 0) {
      setSelected(new Set(candidates.map((c) => c.id)))
      setAmounts(Object.fromEntries(candidates.map((c) => [c.id, String(c.amount)])))
      setDates(Object.fromEntries(candidates.map((c) => [c.id, dateInMonth(thisMonth, Number(c.date.slice(-2)))])))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates])

  if (dismissed || added || candidates.length === 0) return null

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAdd = async () => {
    setAdding(true)
    try {
      const toAdd = candidates.filter((c) => selected.has(c.id))
      await Promise.all(
        toAdd.map((c) => {
          const amount = Number(amounts[c.id] ?? c.amount)
          const date = dates[c.id] ?? dateInMonth(thisMonth, Number(c.date.slice(-2)))
          const payload =
            c.type === 'income'
              ? { type: 'income', amount, date, memberId: c.memberId, source: c.source }
              : {
                  type: 'expense',
                  amount,
                  date,
                  memberId: c.memberId,
                  categoryId: c.categoryId,
                  merchant: c.merchant ?? '',
                  isFixed: true,
                }
          return addDoc(collection(db, 'households', HOUSEHOLD_ID, 'transactions'), payload)
        }),
      )
      setAdded(true)
    } finally {
      setAdding(false)
    }
  }

  if (!reviewing) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-foreground">
          <Repeat className="size-4" />
        </span>
        <p className="flex-1 text-sm text-foreground">
          {candidates.length} recurring item{candidates.length === 1 ? '' : 's'} from {formatMonthLabel(lastMonth)} ready
          for {formatMonthLabel(thisMonth)}.
        </p>
        <button
          type="button"
          onClick={() => setReviewing(true)}
          className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Review
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Not now
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Add {formatMonthLabel(thisMonth)}&apos;s recurring items</h2>
        <div className="flex items-center gap-2 text-xs font-medium">
          <button type="button" onClick={() => setSelected(new Set(candidates.map((c) => c.id)))} className="text-primary hover:underline">
            Select all
          </button>
          <span className="text-muted-foreground">·</span>
          <button type="button" onClick={() => setSelected(new Set())} className="text-muted-foreground hover:text-foreground hover:underline">
            Deselect all
          </button>
        </div>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Based on {formatMonthLabel(lastMonth)}, same day-of-month. Check only what you need, or adjust the date/amount
        if it changed — handy for shifting pay schedules.
      </p>
      <ul className="flex flex-col gap-2">
        {candidates.map((c) => {
          const isChecked = selected.has(c.id)
          const cat = categories.find((cat) => cat.id === c.categoryId)
          const m = members.find((mm) => mm.id === c.memberId)
          return (
            <li
              key={c.id}
              className={cn(
                'flex flex-col gap-2 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-center',
                isChecked ? 'border-border bg-card' : 'border-border bg-accent/40 opacity-60',
              )}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggle(c.id)}
                  aria-pressed={isChecked}
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-md border',
                    isChecked ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                  )}
                >
                  {isChecked && <Check className="size-3.5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {c.type === 'income' ? c.source : c.merchant || cat?.name || 'Uncategorized'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.type === 'income' ? 'Income' : cat?.name} {m ? `· ${m.name.split(' ')[0]}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
                <input
                  type="date"
                  value={dates[c.id] ?? ''}
                  onChange={(e) => setDates((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  disabled={!isChecked}
                  max={new Date().toISOString().slice(0, 10)}
                  className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground disabled:opacity-50"
                />
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amounts[c.id] ?? String(c.amount)}
                    onChange={(e) => setAmounts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                    disabled={!isChecked}
                    className="w-20 rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground disabled:opacity-50"
                  />
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setReviewing(false)}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || selected.size === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {adding ? 'Adding...' : `Add ${selected.size} transaction${selected.size === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  )
}
