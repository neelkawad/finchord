'use client'

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/data'
import { useCategories, useTransactions } from '@/lib/firestore-hooks'
import { matchCategoryGroup } from '@/lib/category-groups'

interface Row {
  label: string
  fixedAmount: number
  flexAmount: number
  amount: number
}

const Y_AXIS_WIDTH = 108
const RIGHT_MARGIN = 56
const ROW_HEIGHT = 36

export function BudgetCategories({ month }: { month: string }) {
  const { categories } = useCategories()
  const { transactions } = useTransactions()

  const savingsCategoryIds = new Set(categories.filter((c) => c.isSavings).map((c) => c.id))

  const spentByCategory: Record<string, number> = {}
  const fixedByCategory: Record<string, number> = {}
  for (const t of transactions) {
    if (t.type !== 'expense' || !t.categoryId) continue
    if (t.date.slice(0, 7) !== month) continue
    spentByCategory[t.categoryId] = (spentByCategory[t.categoryId] ?? 0) + t.amount
    if (savingsCategoryIds.has(t.categoryId)) continue
    if (t.isFixed) {
      fixedByCategory[t.categoryId] = (fixedByCategory[t.categoryId] ?? 0) + t.amount
    }
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
  const rows: Row[] = Object.values(grouped)
    .map((r) => ({ label: r.label, fixedAmount: r.fixedAmount, flexAmount: r.amount - r.fixedAmount, amount: r.amount }))
    .sort((a, b) => b.amount - a.amount)

  const chartHeight = Math.max(rows.length * ROW_HEIGHT, ROW_HEIGHT)
  // Same domain math as the XAxis below — computed here too so the label
  // overlay lines up with where recharts actually draws each bar's end.
  const domainMax = rows.length > 0 ? Math.max(...rows.map((r) => r.amount)) * 1.25 : 1

  return (
    <section aria-labelledby="category-heading" className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="category-heading" className="text-base font-semibold text-foreground">
          Expenses by category
        </h2>
        {rows.length > 0 && (
          <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-1.5 shrink-0 rounded-full bg-primary" />
              Fixed
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 shrink-0 rounded-full bg-primary/30" />
              Flexible
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-card p-4">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No expenses yet.</p>
        ) : (
          <div className="relative" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows}
                layout="vertical"
                margin={{ top: 0, right: RIGHT_MARGIN, left: 0, bottom: 0 }}
                barCategoryGap={8}
              >
                <XAxis type="number" hide domain={[0, domainMax]} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={Y_AXIS_WIDTH}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'var(--accent)' }}
                  formatter={(value, name) => [formatCurrency(Number(value)), name === 'fixedAmount' ? 'Fixed' : 'Flexible']}
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="fixedAmount" stackId="spend" fill="var(--primary)" stroke="var(--card)" strokeWidth={2} maxBarSize={20} />
                <Bar
                  dataKey="flexAmount"
                  stackId="spend"
                  fill="var(--primary)"
                  fillOpacity={0.3}
                  stroke="var(--card)"
                  strokeWidth={2}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                />
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
                    left: `calc(${Y_AXIS_WIDTH}px + (100% - ${Y_AXIS_WIDTH + RIGHT_MARGIN}px) * ${row.amount / domainMax} + 6px)`,
                  }}
                >
                  {formatCurrency(row.amount, { compact: true })}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
