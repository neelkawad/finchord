import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb, getAdminAuth, HOUSEHOLD_ID } from '@/lib/firebase-admin'
import { runWatchdogAgent, currentMonth } from '@/lib/watchdog-agent'

// The tool-use loop (summary lookup, maybe a transactions pull, then the
// digest) has taken ~20s in practice — comfortably past Vercel's default
// serverless timeout, which was killing the request before it could finish.
export const maxDuration = 60

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return false

  // Vercel Cron (if ever re-enabled) sends CRON_SECRET as the bearer token.
  if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) return true

  // Otherwise, the token must be a signed-in household member's Firebase ID token —
  // this is what the Dashboard's "Refresh" button sends.
  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    const memberSnap = await getAdminDb()
      .collection('households')
      .doc(HOUSEHOLD_ID)
      .collection('members')
      .doc(decoded.uid)
      .get()
    return memberSnap.exists
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const month = currentMonth()
    const digest = await runWatchdogAgent(month)

    await getAdminDb()
      .collection('households')
      .doc(HOUSEHOLD_ID)
      .collection('watchdog')
      .doc('latest')
      .set({ month, digest, generatedAt: FieldValue.serverTimestamp() })

    return NextResponse.json({ month, digest })
  } catch (err) {
    console.error('Budget Watchdog run failed:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
