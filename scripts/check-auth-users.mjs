import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf-8'))

initializeApp({ credential: cert(serviceAccount) })
const auth = getAuth()

const emails = ['neelakanta.k@gmail.com', 'sandyavanip@gmail.com']

for (const email of emails) {
  try {
    const user = await auth.getUserByEmail(email)
    console.log(`\n${email}`)
    console.log('  uid:', user.uid)
    console.log('  disabled:', user.disabled)
    console.log('  emailVerified:', user.emailVerified)
    console.log('  providers:', user.providerData.map((p) => p.providerId))
    console.log('  metadata:', user.metadata)
  } catch (err) {
    console.log(`\n${email}`)
    console.log('  ERROR:', err.code, err.message)
  }
}
