import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf-8'))

initializeApp({ credential: cert(serviceAccount) })
const auth = getAuth()

const [email, password] = process.argv.slice(2)
if (!email || !password) {
  console.error('Usage: node scripts/set-password.mjs <email> <password>')
  process.exit(1)
}

const user = await auth.getUserByEmail(email)
await auth.updateUser(user.uid, { password })
console.log(`Password set for ${email} (uid=${user.uid})`)
