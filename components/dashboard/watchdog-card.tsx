'use client'

import { Bot } from 'lucide-react'
import { useWatchdogDigest } from '@/lib/firestore-hooks'

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

  if (loading) return null
  if (!watchdog) return null

  const bullets = digestToBullets(watchdog.digest)

  return (
    <section aria-labelledby="watchdog-heading">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="watchdog-heading" className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Bot className="size-[18px]" />
          Budget Watchdog
        </h2>
        {watchdog.generatedAt && (
          <span className="text-sm font-medium text-muted-foreground">{formatRelativeTime(watchdog.generatedAt)}</span>
        )}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <ul className="flex flex-col gap-3">
          {bullets.map((bullet, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{renderInline(bullet)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
