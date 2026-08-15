'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { MonthPicker } from '@/components/dashboard/month-picker'
import { useCategories, useMembers, useTransactions } from '@/lib/firestore-hooks'
import { computeMonthSummary } from '@/lib/reports'
import { generateStatementPdf } from '@/lib/generate-statement-pdf'
import { currentMonthKey, formatCurrency, formatMonthLabel, monthOptions } from '@/lib/data'
import { cn } from '@/lib/utils'

type RowKey = 'totalIncome' | 'totalSpent' | 'toSavings' | 'balance'

const compareRows: { key: RowKey; label: string; higherIsGood: boolean }[] = [
  { key: 'totalIncome', label: 'Income', higherIsGood: true },
  { key: 'totalSpent', label: 'Spent', higherIsGood: false },
  { key: 'toSavings', label: 'Saved', higherIsGood: true },
  { key: 'balance', label: 'Balance', higherIsGood: true },
]

export default function ReportsPage() {
  const { categories } = useCategories()
  const { members } = useMembers()
  const { transactions } = useTransactions()

  const options = monthOptions()
  const previousMonth = options[1]?.value ?? currentMonthKey()

  const [monthA, setMonthA] = useState(currentMonthKey())
  const [monthB, setMonthB] = useState(previousMonth)
  const [downloadMonth, setDownloadMonth] = useState(currentMonthKey())
  const [downloading, setDownloading] = useState(false)

  const summaryA = computeMonthSummary(transactions, categories, monthA)
  const summaryB = computeMonthSummary(transactions, categories, monthB)

  const handleDownload = () => {
    setDownloading(true)
    try {
      const summary = computeMonthSummary(transactions, categories, downloadMonth)
      generateStatementPdf(summary, categories, members)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <PageHeader title="Reports" subtitle="Compare months, or download a statement for your records." />

        <section aria-labelledby="compare-heading">
          <h2 id="compare-heading" className="mb-3 text-base font-semibold text-foreground">
            Compare Months
          </h2>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <MonthPicker value={monthA} onChange={setMonthA} />
              <MonthPicker value={monthB} onChange={setMonthB} />
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium"></th>
                    <th className="py-2 px-3 font-medium">{formatMonthLabel(monthA)}</th>
                    <th className="py-2 px-3 font-medium">{formatMonthLabel(monthB)}</th>
                    <th className="py-2 pl-3 text-right font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => {
                    const a = summaryA[row.key]
                    const b = summaryB[row.key]
                    const diff = a - b
                    const pct = b !== 0 ? (diff / Math.abs(b)) * 100 : a !== 0 ? 100 : 0
                    const favorable = diff === 0 ? null : row.higherIsGood ? diff > 0 : diff < 0
                    return (
                      <tr key={row.key} className="border-b border-border last:border-0">
                        <td className="py-3 pr-3 font-medium text-foreground">{row.label}</td>
                        <td className="px-3 py-3 tabular-nums text-foreground">{formatCurrency(a, { compact: true })}</td>
                        <td className="px-3 py-3 tabular-nums text-foreground">{formatCurrency(b, { compact: true })}</td>
                        <td
                          className={cn(
                            'py-3 pl-3 text-right tabular-nums font-medium',
                            favorable === null ? 'text-muted-foreground' : favorable ? 'text-positive' : 'text-danger',
                          )}
                        >
                          {diff >= 0 ? '+' : '-'}
                          {formatCurrency(Math.abs(diff), { compact: true })}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            ({pct >= 0 ? '+' : ''}
                            {Math.round(pct)}%)
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section aria-labelledby="statement-heading">
          <h2 id="statement-heading" className="mb-3 text-base font-semibold text-foreground">
            Download Statement
          </h2>
          <div className="flex flex-col items-stretch gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-foreground">Monthly PDF statement</p>
              <p className="text-xs text-muted-foreground">
                Income, expenses, and savings for the selected month, in a printable bank-style format.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <MonthPicker value={downloadMonth} onChange={setDownloadMonth} />
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="size-4" />
                {downloading ? 'Preparing…' : 'Download PDF'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
