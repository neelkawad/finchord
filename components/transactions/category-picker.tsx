'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, PiggyBank } from 'lucide-react'
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { HOUSEHOLD_ID } from '@/lib/constants'
import { resolveIcon, iconKeys } from '@/lib/icon-map'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import type { Category } from '@/lib/data'

function CategoryEditor({
  initial,
  onSaved,
  onCancel,
  onDeleted,
}: {
  initial?: Category
  onSaved: (id: string) => void
  onCancel: () => void
  onDeleted?: () => void
}) {
  const isEditing = !!initial
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.iconKey ?? iconKeys[0])
  const [isSavings, setIsSavings] = useState(initial?.isSavings ?? false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const valid = name.trim().length > 0

  const handleSave = async () => {
    if (!valid) return
    setSubmitting(true)
    setError('')
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'households', HOUSEHOLD_ID, 'categories', initial.id), {
          name: name.trim(),
          icon,
          isSavings,
        })
        onSaved(initial.id)
      } else {
        const ref = await addDoc(collection(db, 'households', HOUSEHOLD_ID, 'categories'), {
          name: name.trim(),
          icon,
          isSavings,
        })
        onSaved(ref.id)
      }
    } catch (err) {
      console.error('Save category error:', err)
      setError('Could not save. Try again.')
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!initial) return
    if (!confirm(`Delete "${initial.name}"? Past transactions in this category will show as "Uncategorized".`)) return
    setSubmitting(true)
    try {
      await deleteDoc(doc(db, 'households', HOUSEHOLD_ID, 'categories', initial.id))
      onDeleted?.()
    } catch (err) {
      console.error('Delete category error:', err)
      setError('Could not delete. Try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
        />

        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9">
          {iconKeys.map((key) => {
            const Icon = resolveIcon(key)
            const active = icon === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setIcon(key)}
                aria-pressed={active}
                className={cn(
                  'flex size-8 items-center justify-center rounded-lg border transition-colors',
                  active ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-foreground hover:border-ring',
                )}
              >
                <Icon className="size-4" />
              </button>
            )
          })}
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-foreground">
          <input
            type="checkbox"
            checked={isSavings}
            onChange={(e) => setIsSavings(e.target.checked)}
            className="size-3.5 rounded border-border"
          />
          Counts as savings/investment, not spending
        </label>

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!valid || submitting}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Check className="size-3.5" />
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X className="size-3.5" />
            Cancel
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50"
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: Category[]
  value: string
  onChange: (id: string) => void
}) {
  const { member } = useAuth()
  const canManage = member?.role === 'parent'
  const [mode, setMode] = useState<'pick' | 'add' | 'edit'>('pick')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  if (mode === 'add') {
    return (
      <CategoryEditor
        onSaved={(id) => {
          onChange(id)
          setMode('pick')
        }}
        onCancel={() => setMode('pick')}
      />
    )
  }

  if (mode === 'edit' && editingCategory) {
    return (
      <CategoryEditor
        initial={editingCategory}
        onSaved={() => {
          setMode('pick')
          setEditingCategory(null)
        }}
        onCancel={() => {
          setMode('pick')
          setEditingCategory(null)
        }}
        onDeleted={() => {
          if (value === editingCategory.id) onChange('')
          setMode('pick')
          setEditingCategory(null)
        }}
      />
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {categories.map((cat) => {
        const Icon = cat.icon
        const active = value === cat.id
        return (
          <div key={cat.id} className="relative">
            <button
              type="button"
              onClick={() => onChange(cat.id)}
              aria-pressed={active}
              className={cn(
                'flex w-full flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors',
                active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-ring',
              )}
            >
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-lg',
                  active ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground',
                )}
              >
                <Icon className="size-[18px]" />
              </span>
              <span className="flex items-center gap-1 text-xs font-medium leading-tight text-foreground">
                <span className="line-clamp-2">{cat.name}</span>
                {cat.isSavings && <PiggyBank className="size-3 shrink-0 text-positive" />}
              </span>
            </button>
            {canManage && (
              <button
                type="button"
                aria-label={`Edit ${cat.name}`}
                onClick={() => {
                  setEditingCategory(cat)
                  setMode('edit')
                }}
                className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
              >
                <Pencil className="size-3" />
              </button>
            )}
          </div>
        )
      })}
      {canManage && (
        <button
          type="button"
          onClick={() => setMode('add')}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-3 text-center text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent">
            <Plus className="size-[18px]" />
          </span>
          <span className="text-xs font-medium leading-tight">New Category</span>
        </button>
      )}
    </div>
  )
}
