import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

function loadServiceAccount(): object {
  // Production (Vercel): credentials come from an env var — never NEXT_PUBLIC_
  // prefixed, since that would ship this secret to the browser bundle.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf-8')
    return JSON.parse(json)
  }

  // Local dev: same gitignored key file the scripts/*.mjs seed scripts already use.
  const localPath = join(process.cwd(), 'scripts', 'serviceAccountKey.json')
  if (existsSync(localPath)) {
    return JSON.parse(readFileSync(localPath, 'utf-8'))
  }

  throw new Error(
    'No Firebase admin credentials found. Set FIREBASE_SERVICE_ACCOUNT_B64 (production) or add scripts/serviceAccountKey.json (local dev).',
  )
}

if (!getApps().length) {
  initializeApp({ credential: cert(loadServiceAccount() as any) })
}

export const adminDb = getFirestore()
export const HOUSEHOLD_ID = 'kawad-family'
