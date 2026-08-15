import { initializeApp, cert } from 'firebase-admin/app'
import { getSecurityRules } from 'firebase-admin/security-rules'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf-8'))

const app = initializeApp({
  credential: cert(serviceAccount),
})

const rulesSource = readFileSync(join(__dirname, '..', 'firestore.rules'), 'utf-8')

const securityRules = getSecurityRules(app)
await securityRules.releaseFirestoreRulesetFromSource(rulesSource)

console.log('Firestore rules deployed.')
