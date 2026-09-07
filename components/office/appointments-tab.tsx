'use client'

import { useState } from 'react'
import { Check, Plus, Trash2, X } from 'lucide-react'
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { HOUSEHOLD_ID } from '@/lib/constants'
import { useAppointments, useMembers } from '@/lib/firestore-hooks'
import { formatDate } from '@/lib/data'

export function AppointmentsTab() {
  const { appointments, loading } = useAppointments()
  const { members } = useMembers()
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [memberId, setMemberId] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setTitle('')
    setDate('')
    setTime('')
    setMemberId('')
    setNotes('')
    setAdding(false)
  }

  const handleAdd = async () => {
    if (!title.trim() || !date) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'households', HOUSEHOLD_ID, 'appointments'), {
        title: title.trim(),
        date,
        time: time || null,
        memberId: memberId || null,
        notes: notes.trim() || null,
        done: false,
      })
      reset()
    } finally {
      setSaving(false)
    }
  }

  const toggleDone = (id: string, done: boolean) => {
    updateDoc(doc(db, 'households', HOUSEHOLD_ID, 'appointments', id), { done: !done })
  }

  const handleDelete = (id: string) => {
    deleteDoc(doc(db, 'households', HOUSEHOLD_ID, 'appointments', id))
  }

  if (loading) return null

  const sorted = [...appointments].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1))
  const upcoming = sorted.filter((a) => !a.done)
  const past = sorted.filter((a) => a.done)

  return (
    <div className="flex flex-col gap-6">
      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Add appointment
        </button>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">New appointment</h2>
            <button type="button" onClick={reset} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Kid's dentist checkup"
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="">Who's it for?</option>
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
            disabled={saving || !title.trim() || !date}
            className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card">
        {upcoming.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No upcoming appointments.</p>
        ) : (
          <ul className="divide-y divide-border">
            {upcoming.map((a) => {
              const m = members.find((mm) => mm.id === a.memberId)
              return (
                <li key={a.id} className="flex items-center gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => toggleDone(a.id, a.done)}
                    aria-pressed={a.done}
                    className="flex size-5 shrink-0 items-center justify-center rounded-md border border-border hover:border-ring"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(a.date)}
                      {a.time ? ` · ${a.time}` : ''}
                      {m ? ` · ${m.name.split(' ')[0]}` : ''}
                      {a.notes ? ` · ${a.notes}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
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

      {past.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Done</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {past.map((a) => (
                <li key={a.id} className="flex items-center gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => toggleDone(a.id, a.done)}
                    aria-pressed={a.done}
                    className="flex size-5 shrink-0 items-center justify-center rounded-md border border-primary bg-primary text-primary-foreground"
                  >
                    <Check className="size-3.5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-muted-foreground line-through">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.date)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    className="shrink-0 text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
