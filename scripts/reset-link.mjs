import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf-8'))

initializeApp({ credential: cert(serviceAccount) })
const auth = getAuth()

const email = process.argv[2]
if (!email) {
  console.error('Usage: node scripts/reset-link.mjs <email>')
  process.exit(1)
}

const link = await auth.generatePasswordResetLink(email)
console.log(`\n${email}\n  ${link}\n`)
