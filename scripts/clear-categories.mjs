import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf-8'))

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const HOUSEHOLD_ID = 'kawad-family'

const snap = await db.collection('households').doc(HOUSEHOLD_ID).collection('categories').get()
const batch = db.batch()
snap.docs.forEach((d) => batch.delete(d.ref))
await batch.commit()

console.log(`Deleted ${snap.size} categories.`)
