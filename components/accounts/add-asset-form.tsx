'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { HOUSEHOLD_ID } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { AssetLocation, Asset } from '@/lib/data'

export function AddAssetForm({ asset }: { asset?: Asset }) {
  const router = useRouter()
  const isEditing = !!asset
  const [name, setName] = useState(asset?.name ?? '')
  const [type, setType] = useState(asset?.type ?? '')
  const [location, setLocation] = useState<AssetLocation>(asset?.location ?? 'US')
  const [value, setValue] = useState(asset ? String(asset.value) : '')
  const [currency, setCurrency] = useState<'USD' | 'INR'>(asset?.currency ?? 'USD')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const valid = name.trim() && type.trim() && Number(value) > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setSubmitting(true)
    setError('')
    const payload = { name: name.trim(), type: type.trim(), location, value: Number(value), currency }
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'households', HOUSEHOLD_ID, 'assets', asset.id), payload)
      } else {
        await addDoc(collection(db, 'households', HOUSEHOLD_ID, 'assets'), payload)
      }
      router.push('/accounts')
    } catch (err) {
      console.error('Save asset error:', err)
      setError('Could not save this asset. Try again.')
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!asset) return
    if (!confirm(`Delete "${asset.name}"?`)) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'households', HOUSEHOLD_ID, 'assets', asset.id))
      router.push('/accounts')
    } catch (err) {
      console.error('Delete asset error:', err)
      setError('Could not delete this asset. Try again.')
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Asset name
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Ancestral Land"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="type" className="text-sm font-medium text-foreground">
            Type
          </label>
          <input
            id="type"
            type="text"
            placeholder="e.g. Land, Apartment, Real Estate"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            required
          />
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">Location</legend>
        <div className="grid grid-cols-2 gap-2">
          {(['US', 'India'] as AssetLocation[]).map((loc) => {
            const active = location === loc
            return (
              <button
                key={loc}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setLocation(loc)
                  setCurrency(loc === 'India' ? 'INR' : 'USD')
                }}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-foreground hover:border-ring',
                )}
              >
                {loc}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="value" className="text-sm font-medium text-foreground">
          Estimated value ({currency})
        </label>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
          <span className="text-sm text-muted-foreground">{currency === 'INR' ? '₹' : '$'}</span>
          <input
            id="value"
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            placeholder="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none"
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
          {submitting ? 'Saving...' : isEditing ? 'Save changes' : 'Save asset'}
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
