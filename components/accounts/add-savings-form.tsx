'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { HOUSEHOLD_ID } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { AccountType, SavingsAccount } from '@/lib/data'

const typeOptions: { value: AccountType; label: string }[] = [
  { value: 'savings', label: 'Savings' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'education', label: 'Education' },
  { value: 'health', label: 'Health' },
]

export function AddSavingsForm({ account }: { account?: SavingsAccount }) {
  const router = useRouter()
  const isEditing = !!account
  const [name, setName] = useState(account?.name ?? '')
  const [type, setType] = useState<AccountType>(account?.type ?? 'savings')
  const [institution, setInstitution] = useState(account?.institution ?? '')
  const [balance, setBalance] = useState(account ? String(account.balance) : '')
  const [accountNumber, setAccountNumber] = useState(account?.accountNumber ?? '')
  const [routingNumber, setRoutingNumber] = useState(account?.routingNumber ?? '')
  const [credentialsHint, setCredentialsHint] = useState(account?.credentialsHint ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const valid = name.trim() && institution.trim() && Number(balance) >= 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setSubmitting(true)
    setError('')
    const payload = {
      name: name.trim(),
      type,
      institution: institution.trim(),
      balance: Number(balance),
      accountNumber: accountNumber.trim() || null,
      routingNumber: routingNumber.trim() || null,
      credentialsHint: credentialsHint.trim() || null,
    }
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'households', HOUSEHOLD_ID, 'savingsAccounts', account.id), payload)
      } else {
        await addDoc(collection(db, 'households', HOUSEHOLD_ID, 'savingsAccounts'), payload)
      }
      router.push('/accounts')
    } catch (err) {
      console.error('Save account error:', err)
      setError('Could not save this account. Try again.')
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!account) return
    if (!confirm(`Delete "${account.name}"?`)) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'households', HOUSEHOLD_ID, 'savingsAccounts', account.id))
      router.push('/accounts')
    } catch (err) {
      console.error('Delete account error:', err)
      setError('Could not delete this account. Try again.')
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
          placeholder="e.g. Household Savings"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          required
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">Type</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {typeOptions.map((opt) => {
            const active = type === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => setType(opt.value)}
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
          <label htmlFor="institution" className="text-sm font-medium text-foreground">
            Institution
          </label>
          <input
            id="institution"
            type="text"
            placeholder="e.g. Fidelity"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            required
          />
        </div>
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
      </div>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium text-foreground">In case of emergency</legend>
        <p className="-mt-2 text-xs text-muted-foreground">
          For family members to operate this account if something happens to you. Account/routing numbers alone can't
          move money — for the password, point to where it's stored rather than writing it here.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="accountNumber" className="text-sm font-medium text-foreground">
              Account number <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="accountNumber"
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="routingNumber" className="text-sm font-medium text-foreground">
              Routing number <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="routingNumber"
              type="text"
              value={routingNumber}
              onChange={(e) => setRoutingNumber(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="credentialsHint" className="text-sm font-medium text-foreground">
            Where to find the login/password <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="credentialsHint"
            type="text"
            placeholder="e.g. 1Password, Family vault"
            value={credentialsHint}
            onChange={(e) => setCredentialsHint(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </fieldset>

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
