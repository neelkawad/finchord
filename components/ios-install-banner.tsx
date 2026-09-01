'use client'

import { useEffect, useState } from 'react'
import { Share, X } from 'lucide-react'

const DISMISS_KEY = 'ios-install-banner-dismissed'

export function IosInstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone =
      (navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches

    let dismissed = false
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === 'true'
    } catch {
      // localStorage unavailable — just show the banner, nothing to remember
    }

    if (isIos && !isStandalone && !dismissed) setShow(true)
  }, [])

  const dismiss = () => {
    setShow(false)
    try {
      localStorage.setItem(DISMISS_KEY, 'true')
    } catch {
      // ignore — banner still dismissed for this view
    }
  }

  if (!show) return null

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-foreground">
        <Share className="size-4" />
      </span>
      <p className="flex-1 text-sm text-foreground">
        Install Nestly on your iPhone: tap <strong>Share</strong>, then <strong>&quot;Add to Home Screen.&quot;</strong>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
