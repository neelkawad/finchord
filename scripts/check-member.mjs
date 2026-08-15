import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf-8'))

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()
const auth = getAuth()

const HOUSEHOLD_ID = 'kawad-family'
const user = await auth.getUserByEmail('sandyavanip@gmail.com')
console.log('Auth uid:', user.uid)

const doc = await db.collection('households').doc(HOUSEHOLD_ID).collection('members').doc(user.uid).get()
console.log('Member doc exists:', doc.exists)
console.log('Member doc data:', doc.data())
