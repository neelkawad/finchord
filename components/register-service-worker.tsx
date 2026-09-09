'use client'

import { useEffect } from 'react'

// Chrome's PWA installability check (the "Install app" / "Add to Home
// screen" prompt on Android) requires a registered service worker with a
// fetch handler, not just a valid manifest — without this, Android Chrome
// won't offer to install the app at all.
export function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  return null
}
