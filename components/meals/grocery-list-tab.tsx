'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
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

  const extraItems = extra
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const allItems = [...selected, ...extraItems]

  const handleSend = () => {
    const lines = ['🛒 Grocery List', ...allItems.map((item) => `- ${item}`)]
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
          <div className="flex flex-wrap gap-1.5">
            {items.map((item) => {
              const active = selected.has(item)
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(item)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-ring hover:text-foreground',
                  )}
                >
                  {item}
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
          <p className="mb-2 text-sm font-medium text-foreground">{allItems.length} item{allItems.length === 1 ? '' : 's'} selected</p>
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
