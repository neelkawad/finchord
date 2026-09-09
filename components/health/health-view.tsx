'use client'

import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { addDoc, collection, deleteDoc, doc } from 'firebase/firestore'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { db } from '@/lib/firebase'
import { HOUSEHOLD_ID } from '@/lib/constants'
import { useMembers, useVitalEntries } from '@/lib/firestore-hooks'
import { formatDate } from '@/lib/data'
import { cn } from '@/lib/utils'

function TrendChart({ title, unit, data }: { title: string; unit: string; data: { date: string; value: number }[] }) {
  if (data.length < 2) {
    return (
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted-foreground">
          Log at least two entries to see a trend.
        </div>
      </div>
    )
  }

  const points = data.map((d) => ({ label: formatDate(d.date), value: d.value }))

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      <div className="h-40 rounded-2xl border border-border bg-card p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              width={36}
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip
              formatter={(value) => [`${value} ${unit}`, title]}
              contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--card)' }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--card)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function HealthView() {
  const { members } = useMembers()
  const { vitalEntries, loading } = useVitalEntries()
  const [selectedMember, setSelectedMember] = useState('')
  const [adding, setAdding] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [heightIn, setHeightIn] = useState('')
  const [weightLb, setWeightLb] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const activeMemberId = selectedMember || members[0]?.id || ''

  const reset = () => {
    setDate(new Date().toISOString().slice(0, 10))
    setHeightIn('')
    setWeightLb('')
    setNotes('')
    setAdding(false)
  }

  const handleAdd = async () => {
    if (!activeMemberId || !date || (!heightIn && !weightLb)) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'households', HOUSEHOLD_ID, 'vitals'), {
        memberId: activeMemberId,
        date,
        heightIn: heightIn ? Number(heightIn) : null,
        weightLb: weightLb ? Number(weightLb) : null,
        notes: notes.trim() || null,
      })
      reset()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    deleteDoc(doc(db, 'households', HOUSEHOLD_ID, 'vitals', id))
  }

  if (loading) return null

  const memberEntries = vitalEntries
    .filter((v) => v.memberId === activeMemberId)
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  const heightData = memberEntries.filter((v) => v.heightIn != null).map((v) => ({ date: v.date, value: v.heightIn! }))
  const weightData = memberEntries.filter((v) => v.weightLb != null).map((v) => ({ date: v.date, value: v.weightLb! }))
  const listSorted = [...memberEntries].reverse()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {members.map((m) => {
          const active = activeMemberId === m.id
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={active}
              onClick={() => setSelectedMember(m.id)}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                active ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-foreground hover:border-ring',
              )}
            >
              {m.name}
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TrendChart title="Height" unit="in" data={heightData} />
        <TrendChart title="Weight" unit="lb" data={weightData} />
      </div>

      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Log entry
        </button>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">New entry</h2>
            <button type="button" onClick={reset} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                placeholder="Height"
                value={heightIn}
                onChange={(e) => setHeightIn(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground outline-none"
              />
              <span className="text-sm text-muted-foreground">in</span>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                placeholder="Weight"
                value={weightLb}
                onChange={(e) => setWeightLb(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground outline-none"
              />
              <span className="text-sm text-muted-foreground">lb</span>
            </div>
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
            disabled={saving || !date || (!heightIn && !weightLb)}
            className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card">
        {listSorted.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No entries logged yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {listSorted.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {entry.heightIn != null ? `${entry.heightIn} in` : ''}
                    {entry.heightIn != null && entry.weightLb != null ? ' · ' : ''}
                    {entry.weightLb != null ? `${entry.weightLb} lb` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(entry.date)}
                    {entry.notes ? ` · ${entry.notes}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  className="shrink-0 text-muted-foreground hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
