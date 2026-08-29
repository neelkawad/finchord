import Anthropic from '@anthropic-ai/sdk'
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod/v4'
import { getAdminDb, HOUSEHOLD_ID } from './firebase-admin'

interface TransactionDoc {
  type: 'income' | 'expense'
  amount: number
  date: string
  categoryId?: string
  merchant?: string
  isFixed?: boolean
}

interface CategoryDoc {
  name: string
  isSavings?: boolean
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

async function getTransactionsForMonth(month: string) {
  const snap = await getAdminDb().collection('households').doc(HOUSEHOLD_ID).collection('transactions').get()
  return snap.docs
    .map((d) => d.data() as TransactionDoc)
    .filter((t) => t.date?.slice(0, 7) === month)
}

async function getCategories() {
  const snap = await getAdminDb().collection('households').doc(HOUSEHOLD_ID).collection('categories').get()
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as CategoryDoc) }))
}

const getMonthSummary = betaZodTool({
  name: 'get_month_summary',
  description:
    "Get total income, spending (excluding savings), savings contributions, and leftover balance for the Kawad household budget in a given month.",
  inputSchema: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/).describe('Month in YYYY-MM format, e.g. 2026-08'),
  }),
  run: async ({ month }) => {
    const [transactions, categories] = await Promise.all([getTransactionsForMonth(month), getCategories()])
    const savingsCategoryIds = new Set(categories.filter((c) => c.isSavings).map((c) => c.id))

    const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = transactions.filter((t) => t.type === 'expense')
    const totalSpent = expenses
      .filter((t) => !savingsCategoryIds.has(t.categoryId ?? ''))
      .reduce((s, t) => s + t.amount, 0)
    const toSavings = expenses
      .filter((t) => savingsCategoryIds.has(t.categoryId ?? ''))
      .reduce((s, t) => s + t.amount, 0)
    const balance = totalIncome - totalSpent - toSavings

    return JSON.stringify({
      month,
      totalIncome: round2(totalIncome),
      totalSpent: round2(totalSpent),
      toSavings: round2(toSavings),
      balance: round2(balance),
    })
  },
})

const listTransactions = betaZodTool({
  name: 'list_transactions',
  description:
    'List individual non-savings expense transactions for a given month, each tagged fixed: true (recurring/debt — rent, EMI, bills) or fixed: false (flexible/discretionary). Optionally filter by category name (case-insensitive substring). Use this to drill into a category or time period that looks worth a closer look.',
  inputSchema: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/).describe('Month in YYYY-MM format, e.g. 2026-08'),
    category: z.string().optional().describe('Filter by category name, case-insensitive substring match'),
  }),
  run: async ({ month, category }) => {
    const [transactions, categories] = await Promise.all([getTransactionsForMonth(month), getCategories()])
    const catById = new Map(categories.map((c) => [c.id, c]))

    let rows = transactions.filter((t) => t.type === 'expense' && !catById.get(t.categoryId ?? '')?.isSavings)

    if (category) {
      const needle = category.toLowerCase()
      rows = rows.filter((t) => (catById.get(t.categoryId ?? '')?.name ?? '').toLowerCase().includes(needle))
    }

    const result = rows
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((t) => ({
        date: t.date,
        amount: round2(t.amount),
        description: t.merchant || catById.get(t.categoryId ?? '')?.name || 'Uncategorized',
        category: t.categoryId ? (catById.get(t.categoryId)?.name ?? null) : null,
        fixed: !!t.isFixed,
      }))

    return JSON.stringify(result)
  },
})

export function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export async function runWatchdogAgent(month: string): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const finalMessage = await anthropic.beta.messages.toolRunner({
    model: 'claude-haiku-4-5',
    max_tokens: 800,
    tools: [getMonthSummary, listTransactions],
    system: `You are Budget Watchdog, a household finance monitor for the Kawad family's FinChord budget.
You have tools to look up this month's summary totals and individual expense transactions — call them
as needed; you decide what to check. For example, look at the summary first, and only pull the full
transaction list (or filter to a specific category) if something in the totals looks worth investigating
further, rather than always pulling everything.

Write a short, plain-English digest (5 bullet points max) covering anything genuinely worth flagging:
- Is spending (totalSpent) on pace to exceed income this month?
- Any single transaction that stands out as unusually large for its category?
- Which category is eating the largest share of FLEXIBLE (fixed: false) spending — that's the controllable part?
- Anything that looks like a duplicate or possible mistake?
Keep it calm and factual — no alarmist tone, no advice beyond what the data shows. If nothing stands out, say so plainly in one line instead of forcing five bullets.`,
    messages: [{ role: 'user', content: `Give me this month's (${month}) budget digest.` }],
  })

  return finalMessage.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
}
