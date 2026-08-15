'use client'

import Link from 'next/link'
import { Landmark, Building2, Trees, TrendingUp, HeartPulse, GraduationCap, PiggyBank, Plus } from 'lucide-react'
import { formatCurrency, formatINR, type AccountType } from '@/lib/data'
import { useSavingsAccounts, useAssets, usePassiveIncome } from '@/lib/firestore-hooks'

function AddLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <Plus className="size-4" />
      {label}
    </Link>
  )
}

const accountTypeMeta: Record<AccountType, { label: string; icon: typeof Landmark }> = {
  savings: { label: 'Savings', icon: PiggyBank },
  retirement: { label: 'Retirement', icon: Landmark },
  education: { label: 'Education', icon: GraduationCap },
  health: { label: 'Health', icon: HeartPulse },
}

export function AccountsView() {
  const { savingsAccounts } = useSavingsAccounts()
  const { assets } = useAssets()
  const { passiveIncome } = usePassiveIncome()
  const totalSavings = savingsAccounts.reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="savings-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="savings-heading" className="text-base font-semibold text-foreground">
              Savings & Retirement
            </h2>
            <p className="text-sm text-muted-foreground">
              Household savings, retirement, education and health accounts
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <p className="text-right text-sm font-semibold tabular-nums text-foreground">
              {formatCurrency(totalSavings, { compact: true })}
            </p>
            <AddLink href="/accounts/savings/add" label="Add" />
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {savingsAccounts.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No accounts added yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {savingsAccounts.map((acc) => {
                const meta = accountTypeMeta[acc.type]
                const Icon = meta.icon
                return (
                  <li key={acc.id}>
                    <Link
                      href={`/accounts/savings/${acc.id}/edit`}
                      className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/50"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-foreground">
                        <Icon className="size-[18px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{acc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {acc.institution} · {meta.label}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                        {formatCurrency(acc.balance, { compact: true })}
                      </p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="assets-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="assets-heading" className="text-base font-semibold text-foreground">
              Assets
            </h2>
            <p className="text-sm text-muted-foreground">
              Real estate and property, listed in local currency (not converted or totaled)
            </p>
          </div>
          <AddLink href="/accounts/assets/add" label="Add" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {assets.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No assets added yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {assets.map((asset) => {
                const Icon = asset.type === 'Land' ? Trees : Building2
                return (
                  <li key={asset.id}>
                    <Link
                      href={`/accounts/assets/${asset.id}/edit`}
                      className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/50"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-foreground">
                        <Icon className="size-[18px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                          {asset.name}
                          {asset.location === 'India' && (
                            <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              India
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {asset.type} · {asset.location}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                        {asset.currency === 'INR' ? formatINR(asset.value) : formatCurrency(asset.value, { compact: true })}
                      </p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="passive-income-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="passive-income-heading" className="text-base font-semibold text-foreground">
              Rental & Interest Income (India)
            </h2>
            <p className="text-sm text-muted-foreground">
              Tracked separately in INR — not included in household income totals
            </p>
          </div>
          <AddLink href="/accounts/income/add" label="Add" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {passiveIncome.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No entries yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {passiveIncome.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`/accounts/income/${entry.id}/edit`}
                    className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/50"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-foreground">
                      <TrendingUp className="size-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{entry.source}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.type} · {entry.frequency}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {formatINR(entry.amount)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
