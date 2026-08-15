import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf-8'))

initializeApp({
  credential: cert(serviceAccount),
})

const db = getFirestore()
const auth = getAuth()

const HOUSEHOLD_ID = 'kawad-family'

const membersToCreate = [
  { name: 'Neel', email: 'neelakanta.k@gmail.com', role: 'parent', initials: 'N', color: 'oklch(0.55 0.06 200)' },
  { name: 'Sandya', email: 'sandyavanip@gmail.com', role: 'parent', initials: 'S', color: 'oklch(0.6 0.09 155)' },
  { name: 'Vaishu', email: 'vaishu.kawad@gmail.com', role: 'kid', initials: 'V', color: 'oklch(0.72 0.13 70)' },
  { name: 'Vaibh', email: 'vaib.kawad@gmail.com', role: 'kid', initials: 'VB', color: 'oklch(0.58 0.15 320)' },
]

const categories = [
  { name: 'Mortgage', group: 'fixed', icon: 'Home' },
  { name: 'Utilities', group: 'fixed', icon: 'Zap' },
  { name: 'Taxes', group: 'fixed', icon: 'Landmark' },
  { name: 'Car Payment', group: 'fixed', icon: 'Car' },
  { name: 'Insurance', group: 'fixed', icon: 'ShieldCheck' },
  { name: 'Debt Payments', group: 'fixed', icon: 'CreditCard' },
  { name: 'Savings/Investments', group: 'fixed', icon: 'PiggyBank' },

  { name: 'Groceries', group: 'variable', icon: 'ShoppingCart' },
  { name: 'Restaurants/Eating Out', group: 'variable', icon: 'UtensilsCrossed' },
  { name: 'Entertainment', group: 'variable', icon: 'Film' },
  { name: 'Family Outings/Weekend Activities', group: 'variable', icon: 'Palmtree' },
  { name: 'Shopping', group: 'variable', icon: 'Shirt' },
  { name: 'Medical', group: 'variable', icon: 'Stethoscope' },
  { name: 'Auto Repairs/Unexpected', group: 'variable', icon: 'Wrench' },
  { name: 'Going Out with Friends', group: 'variable', icon: 'Beer' },
  { name: 'Gas', group: 'variable', icon: 'Fuel' },
  { name: 'Personal/Misc', group: 'variable', icon: 'Wallet' },

  { name: 'School Expenses', group: 'kids', icon: 'GraduationCap' },
  { name: "Kids' Pocket Money", group: 'kids', icon: 'PiggyBank' },
]

async function upsertUser(m) {
  try {
    return await auth.getUserByEmail(m.email)
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      return await auth.createUser({ email: m.email, displayName: m.name, emailVerified: false })
    }
    throw err
  }
}

async function main() {
  await db
    .collection('households')
    .doc(HOUSEHOLD_ID)
    .set({ name: 'Kawad Family', createdAt: FieldValue.serverTimestamp() }, { merge: true })

  const resetLinks = []

  for (const m of membersToCreate) {
    const user = await upsertUser(m)
    await db
      .collection('households')
      .doc(HOUSEHOLD_ID)
      .collection('members')
      .doc(user.uid)
      .set(
        {
          name: m.name,
          role: m.role,
          initials: m.initials,
          color: m.color,
          email: m.email,
          monthlyIncome: 0,
          incomeLabel: m.role === 'parent' ? 'Salary' : 'Allowance',
        },
        { merge: true },
      )

    const link = await auth.generatePasswordResetLink(m.email)
    resetLinks.push({ name: m.name, email: m.email, link })
    console.log(`Member ready: ${m.name} <${m.email}> uid=${user.uid}`)
  }

  const categoriesRef = db.collection('households').doc(HOUSEHOLD_ID).collection('categories')
  const existing = await categoriesRef.limit(1).get()
  if (existing.empty) {
    const batch = db.batch()
    categories.forEach((c) => {
      const ref = categoriesRef.doc()
      batch.set(ref, { ...c, budget: 0, spent: 0 })
    })
    await batch.commit()
    console.log(`Seeded ${categories.length} budget categories.`)
  } else {
    console.log('Categories already exist, skipped.')
  }

  console.log('\nSeed complete.\n')
  console.log('Share each password-setup link below with that family member so they can set their own password:\n')
  resetLinks.forEach(({ name, email, link }) => {
    console.log(`${name} <${email}>\n  ${link}\n`)
  })
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
