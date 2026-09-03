import { initializeApp, cert, getApps, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'
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

let appInstance: App | null = null
let dbInstance: Firestore | null = null
let authInstance: Auth | null = null

// Lazy on purpose: Next.js imports route modules (to inspect their config)
// during `next build`'s "collect page data" step, not just at request time.
// Initializing credentials at module load would throw during every build
// that doesn't have FIREBASE_SERVICE_ACCOUNT_B64 set — so we defer it until
// something actually calls getAdminDb()/getAdminAuth() at request time.
function getAdminApp(): App {
  if (!appInstance) {
    appInstance = getApps().length ? getApps()[0] : initializeApp({ credential: cert(loadServiceAccount() as any) })
  }
  return appInstance
}

export function getAdminDb(): Firestore {
  if (!dbInstance) dbInstance = getFirestore(getAdminApp())
  return dbInstance
}

export function getAdminAuth(): Auth {
  if (!authInstance) authInstance = getAuth(getAdminApp())
  return authInstance
}

export const HOUSEHOLD_ID = 'kawad-family'
