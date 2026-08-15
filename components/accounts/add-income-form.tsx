'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { HOUSEHOLD_ID } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { PassiveIncomeEntry } from '@/lib/data'

export function AddIncomeForm({ entry }: { entry?: PassiveIncomeEntry }) {
  const router = useRouter()
  const isEditing = !!entry
  const [source, setSource] = useState(entry?.source ?? '')
  const [type, setType] = useState<'Rental' | 'Interest'>(entry?.type ?? 'Rental')
  const [amount, setAmount] = useState(entry ? String(entry.amount) : '')
  const [frequency, setFrequency] = useState(entry?.frequency ?? 'Monthly')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const valid = source.trim() && Number(amount) > 0 && frequency.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setSubmitting(true)
    setError('')
    const payload = { source: source.trim(), type, amount: Number(amount), frequency: frequency.trim() }
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'households', HOUSEHOLD_ID, 'passiveIncome', entry.id), payload)
      } else {
        await addDoc(collection(db, 'households', HOUSEHOLD_ID, 'passiveIncome'), payload)
      }
      router.push('/accounts')
    } catch (err) {
      console.error('Save income error:', err)
      setError('Could not save this entry. Try again.')
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!entry) return
    if (!confirm(`Delete "${entry.source}"?`)) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'households', HOUSEHOLD_ID, 'passiveIncome', entry.id))
      router.push('/accounts')
    } catch (err) {
      console.error('Delete income error:', err)
      setError('Could not delete this entry. Try again.')
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="source" className="text-sm font-medium text-foreground">
          Source
        </label>
        <input
          id="source"
          type="text"
          placeholder="e.g. Apartment, Fixed Deposit"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          required
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">Type</legend>
        <div className="grid grid-cols-2 gap-2">
          {(['Rental', 'Interest'] as const).map((t) => {
            const active = type === t
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                onClick={() => setType(t)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-foreground hover:border-ring',
                )}
              >
                {t}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="amount" className="text-sm font-medium text-foreground">
            Amount (INR)
          </label>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
            <span className="text-sm text-muted-foreground">₹</span>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none"
              required
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="frequency" className="text-sm font-medium text-foreground">
            Frequency
          </label>
          <input
            id="frequency"
            type="text"
            placeholder="e.g. Monthly, Quarterly"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            required
          />
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={!valid || submitting || deleting}
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Saving...' : isEditing ? 'Save changes' : 'Save entry'}
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
