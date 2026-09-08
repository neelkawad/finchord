'use client'

import { useEffect, useState } from 'react'
import { Bot, Clock, RefreshCw, X } from 'lucide-react'
import { useWatchdogDigest } from '@/lib/firestore-hooks'
import { currentMonthKey, formatMonthLabel } from '@/lib/data'
import { auth } from '@/lib/firebase'
import { cn } from '@/lib/utils'

const OPEN_KEY = 'watchdog-widget-open'
const SEEN_KEY = 'watchdog-widget-last-seen'

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

export function WatchdogWidget() {
  const { watchdog, loading } = useWatchdogDigest()
  const [open, setOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [hasUnseen, setHasUnseen] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(OPEN_KEY) === 'true') setOpen(true)
    } catch {
      // localStorage unavailable — starts closed
    }
  }, [])

  useEffect(() => {
    if (!watchdog?.generatedAt) return
    try {
      const lastSeen = localStorage.getItem(SEEN_KEY)
      setHasUnseen(lastSeen !== watchdog.generatedAt.toISOString())
    } catch {
      // ignore — badge just won't persist across sessions
    }
  }, [watchdog?.generatedAt])

  const setOpenPersisted = (next: boolean) => {
    setOpen(next)
    try {
      localStorage.setItem(OPEN_KEY, String(next))
      if (next && watchdog?.generatedAt) {
        localStorage.setItem(SEEN_KEY, watchdog.generatedAt.toISOString())
        setHasUnseen(false)
      }
    } catch {
      // ignore — still toggles for this view
    }
  }

  const refresh = async () => {
    if (!auth.currentUser) return
    setRefreshing(true)
    setError('')
    try {
      const token = await auth.currentUser.getIdToken()
      const res = await fetch('/api/watchdog', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || `Refresh failed (${res.status})`)
      }
      // Firestore's onSnapshot (via useWatchdogDigest) picks up the new digest automatically.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not refresh right now. Try again.')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading || !watchdog) return null

  const bullets = digestToBullets(watchdog.digest)
  const isStale = watchdog.month !== currentMonthKey()

  return (
    <div className="fixed bottom-24 right-5 z-40 md:bottom-8 md:right-8">
      {open && (
        <div className="absolute bottom-[calc(100%+12px)] right-0 flex max-h-[70vh] w-[calc(100vw-2.5rem)] max-w-96 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Bot className="size-[18px]" />
              Budget Watchdog
              <span className="font-normal text-muted-foreground">· {formatMonthLabel(watchdog.month)}</span>
            </span>
            <span className="flex items-center gap-3">
              {watchdog.generatedAt && (
                <span className="text-xs font-medium text-muted-foreground">{formatRelativeTime(watchdog.generatedAt)}</span>
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
              <button
                type="button"
                onClick={() => setOpenPersisted(false)}
                aria-label="Close"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </span>
          </div>
          <div className="overflow-y-auto p-4">
            {error && <p className="mb-2 text-sm text-danger">{error}</p>}
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
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpenPersisted(!open)}
        aria-label={open ? 'Close Budget Watchdog' : 'Open Budget Watchdog'}
        aria-expanded={open}
        className="relative flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Bot className="size-6" />
        {hasUnseen && !open && <span className="absolute right-0 top-0 size-3 rounded-full bg-danger ring-2 ring-card" />}
      </button>
    </div>
  )
}
