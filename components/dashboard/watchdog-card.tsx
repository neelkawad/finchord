'use client'

import { useEffect, useState } from 'react'
import { Bot, ChevronDown, Clock, RefreshCw } from 'lucide-react'
import { useWatchdogDigest } from '@/lib/firestore-hooks'
import { currentMonthKey, formatMonthLabel } from '@/lib/data'
import { auth } from '@/lib/firebase'
import { cn } from '@/lib/utils'

const COLLAPSE_KEY = 'watchdog-card-collapsed'

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime()
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return 'just now'
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

function renderInline(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part))
}

function digestToBullets(digest: string) {
  return digest
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => line.replace(/^[-•*]\s*/, ''))
}

export function WatchdogCard() {
  const { watchdog, loading } = useWatchdogDigest()
  const [collapsed, setCollapsed] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === 'true')
    } catch {
      // localStorage unavailable — just keep it expanded
    }
  }, [])

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(COLLAPSE_KEY, String(next))
      } catch {
        // ignore — nothing to persist, still toggles for this view
      }
      return next
    })
  }

  const refresh = async () => {
    if (!auth.currentUser) return
    setRefreshing(true)
    setError('')
    try {
      const token = await auth.currentUser.getIdToken()
      const res = await fetch('/api/watchdog', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Refresh failed')
      // Firestore's onSnapshot (via useWatchdogDigest) picks up the new digest automatically.
    } catch {
      setError('Could not refresh right now. Try again.')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) return null
  if (!watchdog) return null

  const bullets = digestToBullets(watchdog.digest)
  const isStale = watchdog.month !== currentMonthKey()

  return (
    <section aria-labelledby="watchdog-heading">
      <div className="mb-3 flex w-full items-baseline justify-between">
        <button type="button" onClick={toggle} aria-expanded={!collapsed} className="flex items-baseline gap-2 text-left">
          <h2 id="watchdog-heading" className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Bot className="size-[18px]" />
            Budget Watchdog
          </h2>
          <span className="text-sm text-muted-foreground">· {formatMonthLabel(watchdog.month)}</span>
        </button>
        <span className="flex items-center gap-3">
          {watchdog.generatedAt && (
            <span className="text-sm font-medium text-muted-foreground">{formatRelativeTime(watchdog.generatedAt)}</span>
          )}
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            aria-label="Refresh analysis"
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
          </button>
          <button type="button" onClick={toggle} aria-expanded={!collapsed} aria-label={collapsed ? 'Expand' : 'Collapse'}>
            <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', !collapsed && 'rotate-180')} />
          </button>
        </span>
      </div>
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}
      {!collapsed && (
        <div className="rounded-2xl border border-border bg-card p-5">
          {isStale && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-warning-muted p-3 text-sm text-warning">
              <Clock className="mt-0.5 size-4 shrink-0" />
              <p>
                This is from <strong>{formatMonthLabel(watchdog.month)}</strong> — tap the refresh icon above for a
                current analysis.
              </p>
            </div>
          )}
          <ul className="flex flex-col gap-3">
            {bullets.map((bullet, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{renderInline(bullet)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
