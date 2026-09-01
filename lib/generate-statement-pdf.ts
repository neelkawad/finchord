import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate, formatMonthLabel, type Category, type Member } from './data'
import { NESTLY_ICON_BASE64 } from './nestly-icon'
import type { MonthSummary } from './reports'

function txDescription(t: MonthSummary['expenseRows'][number], categories: Category[]) {
  const cat = categories.find((c) => c.id === t.categoryId)
  return t.merchant || cat?.name || 'Transaction'
}

function memberName(memberId: string, members: Member[]) {
  return members.find((m) => m.id === memberId)?.name ?? 'Unknown'
}

export function generateStatementPdf(summary: MonthSummary, categories: Category[], members: Member[]) {
  const doc = new jsPDF({ unit: 'pt' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40

  doc.addImage(NESTLY_ICON_BASE64, 'PNG', margin, 30, 24, 24)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Nestly', margin + 32, 48)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Kawad Family — Monthly Statement', margin, 68)

  const [year, monthNum] = summary.month.split('-').map(Number)
  const fromDate = new Date(year, monthNum - 1, 1).toLocaleDateString('en-US', { dateStyle: 'medium' })
  const toDate = new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })

  doc.setFontSize(10)
  doc.setTextColor(110)
  doc.text(`From: ${fromDate}`, pageWidth - margin, 50, { align: 'right' })
  doc.text(`To: ${toDate}`, pageWidth - margin, 64, { align: 'right' })
  doc.setTextColor(0)

  autoTable(doc, {
    startY: 88,
    margin: { left: margin, right: margin },
    head: [['Income', 'Spent', 'Saved/Invested', 'Balance']],
    body: [
      [
        formatCurrency(summary.totalIncome),
        formatCurrency(summary.totalSpent),
        formatCurrency(summary.toSavings),
        `${summary.balance >= 0 ? '' : '-'}${formatCurrency(Math.abs(summary.balance))}`,
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { halign: 'center', fontSize: 10 },
  })

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24

  const section = (
    title: string,
    rows: MonthSummary['incomeRows'],
    columns: string[],
    mapRow: (t: MonthSummary['incomeRows'][number]) => string[],
    total?: number,
  ) => {
    if (y > doc.internal.pageSize.getHeight() - 100) {
      doc.addPage()
      y = 50
    }
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin, y)
    if (total !== undefined) {
      doc.setFontSize(10)
      doc.text(formatCurrency(total), pageWidth - margin, y, { align: 'right' })
    }
    y += 8
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [columns],
      body: rows.length ? rows.map(mapRow) : [['—', '—', '—', '—'].slice(0, columns.length)],
      theme: 'striped',
      headStyles: { fillColor: [241, 245, 249], textColor: 20, fontStyle: 'bold' },
      styles: { fontSize: 9 },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24
  }

  section(
    'Income',
    summary.incomeRows,
    ['Date', 'Source', 'Member', 'Amount'],
    (t) => [formatDate(t.date), t.source ?? 'Other', memberName(t.memberId, members), formatCurrency(t.amount)],
    summary.totalIncome,
  )

  const fixedExpenseRows = summary.expenseRows.filter((t) => t.isFixed)
  const variableExpenseRows = summary.expenseRows.filter((t) => !t.isFixed)
  const expenseColumns = ['Date', 'Description', 'Category', 'Member', 'Amount']
  const mapExpenseRow = (t: MonthSummary['expenseRows'][number]) => [
    formatDate(t.date),
    txDescription(t, categories),
    categories.find((c) => c.id === t.categoryId)?.name ?? 'Uncategorized',
    memberName(t.memberId, members),
    formatCurrency(t.amount),
  ]

  section(
    'Fixed Expenses',
    fixedExpenseRows,
    expenseColumns,
    mapExpenseRow,
    fixedExpenseRows.reduce((s, t) => s + t.amount, 0),
  )

  section(
    'Variable Expenses',
    variableExpenseRows,
    expenseColumns,
    mapExpenseRow,
    variableExpenseRows.reduce((s, t) => s + t.amount, 0),
  )

  section(
    'Savings & Investments',
    summary.savingsRows,
    ['Date', 'Description', 'Member', 'Amount'],
    (t) => [formatDate(t.date), txDescription(t, categories), memberName(t.memberId, members), formatCurrency(t.amount)],
    summary.toSavings,
  )

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Nestly · ${formatMonthLabel(summary.month)} · Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: 'center' },
    )
  }

  doc.save(`Nestly-Statement-${summary.month}.pdf`)
}
