'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { addDoc, collection, doc, updateDoc, deleteDoc, deleteField } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { HOUSEHOLD_ID } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { SavingsGoal, SavingsGoalGroup } from '@/lib/data'

const groupOptions: { value: SavingsGoalGroup; label: string }[] = [
  { value: 'savings', label: 'Savings' },
  { value: 'investment', label: 'Investments' },
  { value: 'education', label: "Kids' Education" },
  { value: 'emergency', label: 'Emergency Fund' },
]

export function AddGoalForm({ goal }: { goal?: SavingsGoal }) {
  const router = useRouter()
  const isEditing = !!goal
  const [name, setName] = useState(goal?.name ?? '')
  const [group, setGroup] = useState<SavingsGoalGroup>(goal?.group ?? 'savings')
  const [balance, setBalance] = useState(goal ? String(goal.balance) : '')
  const [targetBalance, setTargetBalance] = useState(goal?.targetBalance ? String(goal.targetBalance) : '')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const valid = name.trim() && Number(balance) >= 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setSubmitting(true)
    setError('')
    const payload = {
      name: name.trim(),
      group,
      balance: Number(balance),
      targetBalance: targetBalance.trim() ? Number(targetBalance) : deleteField(),
    }
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'households', HOUSEHOLD_ID, 'goals', goal.id), payload)
      } else {
        await addDoc(collection(db, 'households', HOUSEHOLD_ID, 'goals'), {
          name: payload.name,
          group: payload.group,
          balance: payload.balance,
          ...(targetBalance.trim() ? { targetBalance: Number(targetBalance) } : {}),
        })
      }
      router.push('/goals')
    } catch (err) {
      console.error('Save savings account error:', err)
      setError('Could not save this savings account. Try again.')
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!goal) return
    if (!confirm(`Delete "${goal.name}"?`)) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'households', HOUSEHOLD_ID, 'goals', goal.id))
      router.push('/goals')
    } catch (err) {
      console.error('Delete savings account error:', err)
      setError('Could not delete this savings account. Try again.')
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Account name
        </label>
        <input
          id="name"
          type="text"
          placeholder="e.g. HYSA, 529 Plan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          required
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">Group</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {groupOptions.map((opt) => {
            const active = group === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => setGroup(opt.value)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-foreground hover:border-ring',
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="balance" className="text-sm font-medium text-foreground">
            Current balance
          </label>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
            <span className="text-sm text-muted-foreground">$</span>
            <input
              id="balance"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              placeholder="0"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none"
              required
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="targetBalance" className="text-sm font-medium text-foreground">
            Target balance <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
            <span className="text-sm text-muted-foreground">$</span>
            <input
              id="targetBalance"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              placeholder="6000"
              value={targetBalance}
              onChange={(e) => setTargetBalance(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={!valid || submitting || deleting}
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Saving...' : isEditing ? 'Save changes' : 'Save account'}
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
