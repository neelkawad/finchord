'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Trash2, ArrowDownCircle, ArrowUpCircle, Landmark } from 'lucide-react'
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { HOUSEHOLD_ID } from '@/lib/constants'
import { formatCurrency, incomeSources, type Transaction, type TransactionType } from '@/lib/data'
import { useCategories, useDebts } from '@/lib/firestore-hooks'
import { useAuth } from '@/lib/auth-context'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { CategoryPicker } from '@/components/transactions/category-picker'
import { cn } from '@/lib/utils'

export function AddTransactionForm({ transaction }: { transaction?: Transaction }) {
  const router = useRouter()
  const { member } = useAuth()
  const { categories } = useCategories()
  const { debts } = useDebts()
  const creditCards = debts.filter((d) => d.group === 'credit')
  const today = new Date().toISOString().slice(0, 10)
  const isEditing = !!transaction
  const monthStart = `${today.slice(0, 4)}-${today.slice(5, 7)}-01`
  const monthEnd = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).toISOString().slice(0, 10)

  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense')
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? '')
  const [cardId, setCardId] = useState(transaction?.cardId ?? '')
  const [source, setSource] = useState(transaction?.source ?? incomeSources[0])
  const [date, setDate] = useState(transaction?.date ?? today)
  const [merchant, setMerchant] = useState(transaction?.merchant ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const amountValue = Number(amount)
  const dateInRange = isEditing || (date >= monthStart && date <= monthEnd)
  const valid = amountValue > 0 && date && dateInRange && member && (type === 'income' ? source : categoryId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || !member) return
    setSubmitting(true)
    setError('')
    const payload =
      type === 'income'
        ? { type, amount: amountValue, date, source, memberId: transaction?.memberId ?? member.id }
        : {
            type,
            amount: amountValue,
            date,
            categoryId,
            cardId: cardId || null,
            merchant: merchant.trim(),
            memberId: transaction?.memberId ?? member.id,
          }
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'households', HOUSEHOLD_ID, 'transactions', transaction.id), payload)
        router.push('/transactions')
      } else {
        await addDoc(collection(db, 'households', HOUSEHOLD_ID, 'transactions'), payload)
        setSubmitted(true)
        setTimeout(() => router.push('/transactions'), 900)
      }
    } catch (err) {
      console.error('Save transaction error:', err)
      setError('Could not save this transaction. Try again.')
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!transaction) return
    if (!confirm('Delete this transaction?')) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'households', HOUSEHOLD_ID, 'transactions', transaction.id))
      router.push('/transactions')
    } catch (err) {
      console.error('Delete transaction error:', err)
      setError('Could not delete this transaction. Try again.')
      setDeleting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-positive-muted text-positive">
          <Check className="size-7" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          {type === 'income' ? 'Income added' : 'Transaction added'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatCurrency(amountValue)} logged. Taking you back to transactions…
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Type toggle */}
      <fieldset>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={type === 'expense'}
            onClick={() => setType('expense')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
              type === 'expense' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-foreground hover:border-ring',
            )}
          >
            <ArrowUpCircle className="size-4" />
            Expense
          </button>
          <button
            type="button"
            aria-pressed={type === 'income'}
            onClick={() => setType('income')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
              type === 'income' ? 'border-positive bg-positive-muted text-positive' : 'border-border bg-card text-foreground hover:border-ring',
            )}
          >
            <ArrowDownCircle className="size-4" />
            Income
          </button>
        </div>
      </fieldset>

      {/* Amount */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <label htmlFor="amount" className="text-sm font-medium text-foreground">
          Amount
        </label>
        <div className="mt-2 flex items-center gap-1 border-b border-border pb-2">
          <span className="text-3xl font-semibold text-muted-foreground">$</span>
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent text-3xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/50"
            required
          />
        </div>
      </div>

      {type === 'income' ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-foreground">Source</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {incomeSources.map((s) => {
              const active = source === s
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSource(s)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    active ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-foreground hover:border-ring',
                  )}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </fieldset>
      ) : (
        <>
          {/* Category picker */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">Category</legend>
            <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
          </fieldset>

          {/* Card picker */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">
              Card <span className="font-normal text-muted-foreground">(optional)</span>
            </legend>
            {creditCards.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                No credit cards added yet — add one under Debt to track spend by card.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {creditCards.map((c) => {
                  const active = cardId === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCardId(active ? '' : c.id)}
                      aria-pressed={active}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                        active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-ring',
                      )}
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-foreground">
                        <Landmark className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.interestRate}% interest</p>
                      </div>
                      {active && <Check className="ml-auto size-4 shrink-0 text-primary" />}
                    </button>
                  )
                })}
              </div>
            )}
          </fieldset>
        </>
      )}

      {/* Date + merchant */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date" className="text-sm font-medium text-foreground">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={isEditing ? undefined : monthStart}
            max={isEditing ? undefined : monthEnd}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            required
          />
          {!isEditing && !dateInRange && (
            <p className="text-xs text-danger">Only dates in the current month are allowed.</p>
          )}
        </div>
        {type === 'expense' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="merchant" className="text-sm font-medium text-foreground">
              Merchant / note <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="merchant"
              type="text"
              placeholder="e.g. Whole Foods"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
        )}
      </div>

      {/* Spent/received by */}
      {member && !isEditing && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3">
          <span className="text-sm text-muted-foreground">{type === 'income' ? 'Received by' : 'Spent by'}</span>
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MemberAvatar member={member} size="sm" />
            {member.name}
          </span>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Submit */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={!valid || submitting || deleting}
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Saving...' : isEditing ? 'Save changes' : type === 'income' ? 'Save income' : 'Save transaction'}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting || deleting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Trash2 className="size-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>
    </form>
  )
}
