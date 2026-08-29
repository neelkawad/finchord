import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb, HOUSEHOLD_ID } from '@/lib/firebase-admin'
import { runWatchdogAgent, currentMonth } from '@/lib/watchdog-agent'

export async function GET(req: NextRequest) {
  // Vercel Cron sends this header automatically once CRON_SECRET is set as an
  // env var — without this check, the route would be a public URL anyone
  // could hit to burn API credits.
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
    console.error('Budget Watchdog cron run failed:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
