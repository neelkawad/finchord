'use client'

import { useEffect, useState } from 'react'
import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { HOUSEHOLD_ID } from '@/lib/constants'
import { useChores, useMembers, emptyChoreWeek, MEAL_PLAN_DAYS, type ChoreWeek, type ChoreItem } from '@/lib/firestore-hooks'
import { cn } from '@/lib/utils'

const dayLabels: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

const dayKeysBySundayFirst = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function todayKey() {
  return dayKeysBySundayFirst[new Date().getDay()]
}

function newChoreId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())
}

export function ChoresTab() {
  const { chores, loading } = useChores()
  const { members } = useMembers()
  const [week, setWeek] = useState<ChoreWeek>(emptyChoreWeek())
  const [editing, setEditing] = useState(false)
  const [draftText, setDraftText] = useState<Record<string, string>>({})
  const [draftMember, setDraftMember] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (chores) setWeek(chores)
  }, [chores])

  const persist = async (next: ChoreWeek) => {
    setWeek(next)
    await setDoc(doc(db, 'households', HOUSEHOLD_ID, 'chores', 'weekly'), next)
  }

  const toggleDone = (day: string, id: string) => {
    const next = {
      ...week,
      [day]: (week[day] ?? []).map((c) => (c.id === id ? { ...c, done: !c.done } : c)),
    }
    persist(next)
  }

  const addChore = (day: string) => {
    const text = (draftText[day] ?? '').trim()
    if (!text) return
    const item: ChoreItem = { id: newChoreId(), text, memberId: draftMember[day] || undefined, done: false }
    const next = { ...week, [day]: [...(week[day] ?? []), item] }
    setWeek(next)
    setDraftText((prev) => ({ ...prev, [day]: '' }))
  }

  const removeChore = (day: string, id: string) => {
    setWeek((prev) => ({ ...prev, [day]: (prev[day] ?? []).filter((c) => c.id !== id) }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'households', HOUSEHOLD_ID, 'chores', 'weekly'), week)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  if (!editing) {
    const day = todayKey()
    const items = week[day] ?? []
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Today — {dayLabels[day]}</h2>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <Pencil className="size-3.5" />
              Edit chores
            </button>
          </div>
          {items.length === 0 ? (
            <p className="text-sm italic text-muted-foreground/70">No chores set for today.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((item) => {
                const m = members.find((mm) => mm.id === item.memberId)
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => toggleDone(day, item.id)}
                      aria-pressed={item.done}
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-md border',
                        item.done ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                      )}
                    >
                      {item.done && <Check className="size-3.5" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate text-sm', item.done ? 'text-muted-foreground line-through' : 'text-foreground')}>
                        {item.text}
                      </p>
                    </div>
                    {m && <span className="shrink-0 text-xs text-muted-foreground">{m.name.split(' ')[0]}</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {MEAL_PLAN_DAYS.map((day) => (
          <div key={day} className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">{dayLabels[day]}</h2>
            <ul className="mb-3 flex flex-col gap-2">
              {(week[day] ?? []).map((item) => {
                const m = members.find((mm) => mm.id === item.memberId)
                return (
                  <li key={item.id} className="flex items-center gap-2 rounded-lg bg-accent/40 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{item.text}</span>
                    {m && <span className="shrink-0 text-xs text-muted-foreground">{m.name.split(' ')[0]}</span>}
                    <button
                      type="button"
                      onClick={() => removeChore(day, item.id)}
                      className="shrink-0 text-muted-foreground hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={draftText[day] ?? ''}
                onChange={(e) => setDraftText((prev) => ({ ...prev, [day]: e.target.value }))}
                placeholder="Add a chore"
                className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              <select
                value={draftMember[day] ?? ''}
                onChange={(e) => setDraftMember((prev) => ({ ...prev, [day]: e.target.value }))}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="">Assign to...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => addChore(day)}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
              >
                <Plus className="size-4" />
                Add
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save chores'}
        </button>
      </div>
    </div>
  )
}
