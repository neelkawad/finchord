'use client'

import { useEffect, useRef, useState } from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/data'
import { useCategories, useTransactions } from '@/lib/firestore-hooks'
import { matchCategoryGroup } from '@/lib/category-groups'

type RowKind = 'income' | 'expense' | 'savings'

interface Row {
  label: string
  fixedAmount: number
  flexAmount: number
  amount: number
  kind: RowKind
  masked: boolean
}

const ROW_HEIGHT = 36

// Fixed pixel widths for the label column and right margin ate a huge share
// of a phone's screen (108px of ~340px available), leaving barely any room
// for the bars themselves — scale both down with the card's actual measured
// width instead of a hard breakpoint.
function useChartDimensions() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(320)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setWidth(w)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // The old thresholds (108 cap, <360 breakpoint) barely kicked in for most
  // real phones (~380-430px CSS width), so bars still only got ~55% of the
  // card's width. Tighter cap + a higher breakpoint keeps bars at ~65-70%
  // on phones while desktop (much wider) is unaffected either way.
  const yAxisWidth = Math.round(Math.max(56, Math.min(90, width * 0.22)))
  const rightMargin = width < 420 ? 36 : 56
  return { ref, yAxisWidth, rightMargin }
}

function cellFill(row: Row) {
  if (row.kind === 'income') return 'var(--positive)'
  if (row.kind === 'savings') return 'var(--chart-2)'
  return 'var(--primary)'
}

function cellOpacity(row: Row, segment: 'fixedAmount' | 'flexAmount') {
  if (row.kind !== 'expense') return 1
  return segment === 'fixedAmount' ? 1 : 0.3
}

export function SpendingBreakdown({ month, showIncome, showSaved }: { month: string; showIncome: boolean; showSaved: boolean }) {
  const { categories } = useCategories()
  const { transactions } = useTransactions()
  const { ref: dimensionsRef, yAxisWidth, rightMargin } = useChartDimensions()

  const thisMonth = transactions.filter((t) => t.date.slice(0, 7) === month)
  const savingsCategoryIds = new Set(categories.filter((c) => c.isSavings).map((c) => c.id))

  const totalIncome = thisMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)

  const spentByCategory: Record<string, number> = {}
  const fixedByCategory: Record<string, number> = {}
  let totalSaved = 0
  for (const t of thisMonth) {
    if (t.type !== 'expense' || !t.categoryId) continue
    if (savingsCategoryIds.has(t.categoryId)) {
      totalSaved += t.amount
      continue
    }
    spentByCategory[t.categoryId] = (spentByCategory[t.categoryId] ?? 0) + t.amount
    if (t.isFixed) fixedByCategory[t.categoryId] = (fixedByCategory[t.categoryId] ?? 0) + t.amount
  }

  const withSpend = categories
    .filter((cat) => !cat.isSavings)
    .map((cat) => ({ ...cat, spent: spentByCategory[cat.id] ?? 0, fixedSpent: fixedByCategory[cat.id] ?? 0 }))
    .filter((cat) => cat.spent > 0)

  const grouped: Record<string, { label: string; amount: number; fixedAmount: number }> = {}
  for (const cat of withSpend) {
    const match = matchCategoryGroup(cat.name)
    const key = match ? match.label : cat.name
    if (!grouped[key]) grouped[key] = { label: key, amount: 0, fixedAmount: 0 }
    grouped[key].amount += cat.spent
    grouped[key].fixedAmount += cat.fixedSpent
  }

  const rows: Row[] = [
    ...(totalIncome > 0
      ? [{ label: 'Income', fixedAmount: totalIncome, flexAmount: 0, amount: totalIncome, kind: 'income' as const, masked: !showIncome }]
      : []),
    ...Object.values(grouped).map((r) => ({
      label: r.label,
      fixedAmount: r.fixedAmount,
      flexAmount: r.amount - r.fixedAmount,
      amount: r.amount,
      kind: 'expense' as const,
      masked: false,
    })),
    ...(totalSaved > 0
      ? [{ label: 'Savings', fixedAmount: totalSaved, flexAmount: 0, amount: totalSaved, kind: 'savings' as const, masked: !showSaved }]
      : []),
  ].sort((a, b) => b.amount - a.amount)

  const chartHeight = Math.max(rows.length * ROW_HEIGHT, ROW_HEIGHT)
  const domainMax = rows.length > 0 ? Math.max(...rows.map((r) => r.amount)) * 1.25 : 1

  return (
    <section aria-labelledby="breakdown-heading" className="flex h-full flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="breakdown-heading" className="text-base font-semibold text-foreground">
          Breakdown
        </h2>
        {rows.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-muted-foreground">
            {rows.some((r) => r.kind === 'income') && (
              <span className="flex items-center gap-1">
                <span className="size-1.5 shrink-0 rounded-full" style={{ background: 'var(--positive)' }} />
                Income
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="size-1.5 shrink-0 rounded-full bg-primary" />
              Fixed
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 shrink-0 rounded-full bg-primary/30" />
              Flexible
            </span>
            {rows.some((r) => r.kind === 'savings') && (
              <span className="flex items-center gap-1">
                <span className="size-1.5 shrink-0 rounded-full" style={{ background: 'var(--chart-2)' }} />
                Savings
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-card p-4">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No activity yet this month.</p>
        ) : (
          <div ref={dimensionsRef} className="relative" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows}
                layout="vertical"
                margin={{ top: 0, right: rightMargin, left: 0, bottom: 0 }}
                barCategoryGap={8}
              >
                <XAxis type="number" hide domain={[0, domainMax]} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={yAxisWidth}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="fixedAmount" stackId="spend" stroke="var(--card)" strokeWidth={2} maxBarSize={20}>
                  {rows.map((row, i) => (
                    <Cell key={i} fill={cellFill(row)} fillOpacity={cellOpacity(row, 'fixedAmount')} />
                  ))}
                </Bar>
                <Bar dataKey="flexAmount" stackId="spend" stroke="var(--card)" strokeWidth={2} radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {rows.map((row, i) => (
                    <Cell key={i} fill={cellFill(row)} fillOpacity={cellOpacity(row, 'flexAmount')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Total labels, positioned by hand: recharts skips a segment's
                label whenever that segment's own value is 0, so a category
                that's 100% fixed (or 100% flexible) would silently lose its
                total if we relied on the stack's built-in label mechanism. */}
            <div className="pointer-events-none absolute inset-0">
              {rows.map((row, i) => (
                <span
                  key={row.label}
                  className="absolute -translate-y-1/2 whitespace-nowrap text-xs font-semibold text-foreground"
                  style={{
                    top: i * ROW_HEIGHT + ROW_HEIGHT / 2,
                    left: `calc(${yAxisWidth}px + (100% - ${yAxisWidth + rightMargin}px) * ${row.amount / domainMax} + 6px)`,
                  }}
                >
                  {row.masked ? '••••' : formatCurrency(row.amount, { compact: true })}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
