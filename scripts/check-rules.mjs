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

const securityRules = getSecurityRules(app)
const ruleset = await securityRules.getFirestoreRuleset()
console.log('Ruleset name:', ruleset.name)
console.log('Create time:', ruleset.createTime)
for (const file of ruleset.source) {
  console.log('--- file:', file.name, '---')
  console.log(file.content)
}
