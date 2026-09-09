'use client'

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CategoryTrend } from '@/lib/reports'
import { formatCurrency, formatMonthLabel } from '@/lib/data'

const SERIES_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--muted-foreground)']

export function SpendingTrendChart({ trend }: { trend: CategoryTrend }) {
  const data = trend.months.map((month, i) => {
    const row: Record<string, number | string> = { month: formatMonthLabel(month).split(' ')[0] }
    for (const s of trend.series) row[s.name] = s.totals[i]
    return row
  })

  const hasData = trend.series.some((s) => s.totals.some((n) => n > 0))

  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        Not enough spending history yet to chart a trend.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCurrency(v, { compact: true })}
              width={56}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {trend.series.map((s, i) => {
              const color = SERIES_COLORS[i % SERIES_COLORS.length]
              return (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={s.name}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 4, fill: color, strokeWidth: 2, stroke: 'var(--card)' }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--card)' }}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
