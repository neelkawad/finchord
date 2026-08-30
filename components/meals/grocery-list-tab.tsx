'use client'

import { useState } from 'react'
import { Check, MessageCircle, RotateCcw } from 'lucide-react'
import { GROCERY_CATEGORIES } from '@/lib/grocery-items'
import { cn } from '@/lib/utils'

export function GroceryListTab() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [extra, setExtra] = useState('')

  const toggle = (item: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(item)) next.delete(item)
      else next.add(item)
      return next
    })
  }

  const handleReset = () => {
    setSelected(new Set())
    setExtra('')
  }

  const extraItems = extra
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const allItems = [...selected, ...extraItems]

  const handleSend = () => {
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

    const lines = [`🛒 Grocery List — ${dateStr} · ${timeStr}`, ...allItems.map((item) => `- ${item}`)]
    const text = lines.join('\n')

    if (navigator.share) {
      navigator.share({ text })
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {GROCERY_CATEGORIES.map(({ category, items }) => (
        <div key={category}>
          <h2 className="mb-2 text-sm font-semibold text-foreground">{category}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {items.map((item) => {
              const active = selected.has(item)
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(item)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-foreground hover:border-ring',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-full border',
                      active ? 'border-primary-foreground/60 bg-primary-foreground/20' : 'border-border',
                    )}
                  >
                    {active && <Check className="size-3" />}
                  </span>
                  <span className="truncate">{item}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="extra-items" className="text-sm font-medium text-foreground">
          Anything else? <span className="font-normal text-muted-foreground">(comma separated)</span>
        </label>
        <input
          id="extra-items"
          type="text"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="e.g. Detergent, Toothpaste"
          className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {allItems.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {allItems.length} item{allItems.length === 1 ? '' : 's'} selected
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3" />
              Reset
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{allItems.join(', ')}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleSend}
        disabled={allItems.length === 0}
        className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-positive px-4 py-2.5 text-sm font-semibold text-positive-foreground shadow-sm transition-colors hover:bg-positive/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MessageCircle className="size-4" />
        Send via WhatsApp
      </button>
    </div>
  )
}
