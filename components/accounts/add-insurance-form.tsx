'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { HOUSEHOLD_ID } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { InsuranceType, InsurancePolicy } from '@/lib/data'

const typeOptions: { value: InsuranceType; label: string }[] = [
  { value: 'life', label: 'Life' },
  { value: 'health', label: 'Health' },
  { value: 'auto', label: 'Auto' },
  { value: 'home', label: 'Home' },
  { value: 'other', label: 'Other' },
]

export function AddInsuranceForm({ policy }: { policy?: InsurancePolicy }) {
  const router = useRouter()
  const isEditing = !!policy
  const [name, setName] = useState(policy?.name ?? '')
  const [type, setType] = useState<InsuranceType>(policy?.type ?? 'life')
  const [provider, setProvider] = useState(policy?.provider ?? '')
  const [coverageAmount, setCoverageAmount] = useState(policy ? String(policy.coverageAmount) : '')
  const [premium, setPremium] = useState(policy ? String(policy.premium) : '')
  const [premiumFrequency, setPremiumFrequency] = useState<'monthly' | 'annual'>(policy?.premiumFrequency ?? 'annual')
  const [renewalDate, setRenewalDate] = useState(policy?.renewalDate ?? '')
  const [beneficiary, setBeneficiary] = useState(policy?.beneficiary ?? '')
  const [policyNumber, setPolicyNumber] = useState(policy?.policyNumber ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const valid = name.trim() && provider.trim() && Number(coverageAmount) > 0 && Number(premium) >= 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setSubmitting(true)
    setError('')
    const payload = {
      name: name.trim(),
      type,
      provider: provider.trim(),
      coverageAmount: Number(coverageAmount),
      premium: Number(premium),
      premiumFrequency,
      renewalDate: renewalDate || null,
      beneficiary: beneficiary.trim() || null,
      policyNumber: policyNumber.trim() || null,
    }
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'households', HOUSEHOLD_ID, 'insurancePolicies', policy.id), payload)
      } else {
        await addDoc(collection(db, 'households', HOUSEHOLD_ID, 'insurancePolicies'), payload)
      }
      router.push('/accounts')
    } catch (err) {
      console.error('Save insurance policy error:', err)
      setError('Could not save this policy. Try again.')
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!policy) return
    if (!confirm(`Delete "${policy.name}"?`)) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'households', HOUSEHOLD_ID, 'insurancePolicies', policy.id))
      router.push('/accounts')
    } catch (err) {
      console.error('Delete insurance policy error:', err)
      setError('Could not delete this policy. Try again.')
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Policy name
        </label>
        <input
          id="name"
          type="text"
          placeholder="e.g. Neel - Term Life"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          required
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">Type</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
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
          <label htmlFor="provider" className="text-sm font-medium text-foreground">
            Provider
          </label>
          <input
            id="provider"
            type="text"
            placeholder="e.g. State Farm"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="coverageAmount" className="text-sm font-medium text-foreground">
            Coverage amount
          </label>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
            <span className="text-sm text-muted-foreground">$</span>
            <input
              id="coverageAmount"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              placeholder="0"
              value={coverageAmount}
              onChange={(e) => setCoverageAmount(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="premium" className="text-sm font-medium text-foreground">
            Premium
          </label>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
            <span className="text-sm text-muted-foreground">$</span>
            <input
              id="premium"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              placeholder="0"
              value={premium}
              onChange={(e) => setPremium(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none"
              required
            />
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-foreground">Frequency</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['monthly', 'annual'] as const).map((f) => {
              const active = premiumFrequency === f
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPremiumFrequency(f)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors',
                    active ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-foreground hover:border-ring',
                  )}
                >
                  {f}
                </button>
              )
            })}
          </div>
        </fieldset>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="renewalDate" className="text-sm font-medium text-foreground">
            Renewal date <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="renewalDate"
            type="date"
            value={renewalDate}
            onChange={(e) => setRenewalDate(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="policyNumber" className="text-sm font-medium text-foreground">
            Policy number <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="policyNumber"
            type="text"
            value={policyNumber}
            onChange={(e) => setPolicyNumber(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="beneficiary" className="text-sm font-medium text-foreground">
          Beneficiary <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="beneficiary"
          type="text"
          placeholder="e.g. Spouse, Kids"
          value={beneficiary}
          onChange={(e) => setBeneficiary(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={!valid || submitting || deleting}
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Saving...' : isEditing ? 'Save changes' : 'Save policy'}
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
