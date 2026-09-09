'use client'

import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { addDoc, collection, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { HOUSEHOLD_ID } from '@/lib/constants'
import { useFamilyDocuments, useMembers } from '@/lib/firestore-hooks'
import type { DocumentType } from '@/lib/data'
import { cn } from '@/lib/utils'

const typeOptions: { value: DocumentType; label: string }[] = [
  { value: 'passport', label: 'Passport' },
  { value: 'visa', label: 'Visa' },
  { value: 'license', label: 'License' },
  { value: 'green_card', label: 'Green Card' },
  { value: 'other', label: 'Other' },
]

function daysUntil(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function expiryStatus(days: number): { label: string; dot: string; text: string } {
  if (days < 0) return { label: 'Expired', dot: 'bg-danger', text: 'text-danger' }
  if (days <= 90) return { label: `${days}d left`, dot: 'bg-danger', text: 'text-danger' }
  if (days <= 180) return { label: `${days}d left`, dot: 'bg-warning', text: 'text-warning' }
  return { label: `${days}d left`, dot: 'bg-positive', text: 'text-muted-foreground' }
}

export function DocumentsTab() {
  const { familyDocuments, loading } = useFamilyDocuments()
  const { members } = useMembers()
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<DocumentType>('passport')
  const [memberId, setMemberId] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setTitle('')
    setType('passport')
    setMemberId('')
    setExpiryDate('')
    setNotes('')
    setAdding(false)
  }

  const handleAdd = async () => {
    if (!title.trim() || !expiryDate) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'households', HOUSEHOLD_ID, 'familyDocuments'), {
        title: title.trim(),
        type,
        memberId: memberId || null,
        expiryDate,
        notes: notes.trim() || null,
      })
      reset()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    deleteDoc(doc(db, 'households', HOUSEHOLD_ID, 'familyDocuments', id))
  }

  if (loading) return null

  const sorted = [...familyDocuments].sort((a, b) => (a.expiryDate < b.expiryDate ? -1 : 1))

  return (
    <div className="flex flex-col gap-6">
      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Add document
        </button>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">New document</h2>
            <button type="button" onClick={reset} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Neel - Passport"
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
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
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="">Whose is it?</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !title.trim() || !expiryDate}
            className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card">
        {sorted.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No documents tracked yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((docItem) => {
              const m = members.find((mm) => mm.id === docItem.memberId)
              const status = expiryStatus(daysUntil(docItem.expiryDate))
              return (
                <li key={docItem.id} className="flex items-center gap-3 p-4">
                  <span className={cn('size-2 shrink-0 rounded-full', status.dot)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{docItem.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires {docItem.expiryDate}
                      {m ? ` · ${m.name.split(' ')[0]}` : ''}
                      {docItem.notes ? ` · ${docItem.notes}` : ''}
                    </p>
                  </div>
                  <span className={cn('shrink-0 text-xs font-semibold', status.text)}>{status.label}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(docItem.id)}
                    className="shrink-0 text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
