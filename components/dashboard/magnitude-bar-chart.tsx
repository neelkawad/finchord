'use client'

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/data'

export interface MagnitudeBarRow {
  label: string
  amount: number
}

// Horizontal single-hue bar chart for ranking a handful of named amounts
// (income by source, savings by category) — magnitude comparison, not
// series identity, so one hue is the right color job here.
export function MagnitudeBarChart({ rows }: { rows: MagnitudeBarRow[] }) {
  const rowHeight = 36
  const height = Math.max(rows.length * rowHeight, rowHeight)

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }} barCategoryGap={8}>
          <XAxis type="number" hide domain={[0, (max: number) => max * 1.25]} />
          <YAxis
            type="category"
            dataKey="label"
            width={108}
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--accent)' }}
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="amount" fill="var(--primary)" radius={[0, 4, 4, 0]} maxBarSize={20}>
            <LabelList
              dataKey="amount"
              position="right"
              formatter={(value) => formatCurrency(Number(value), { compact: true })}
              style={{ fill: 'var(--foreground)', fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
