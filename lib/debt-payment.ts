export function round2(n: number) {
  return Math.round(n * 100) / 100
}

export interface AmortizationSplit {
  interest: number
  principal: number
  newBalance: number
}

// Standard amortization math: this month's interest is a share of the
// CURRENT balance (not the payment), and whatever's left of the payment
// goes to principal. A 0% debt (interestRate = 0) naturally sends the full
// payment to principal — no special case needed.
export function computeAmortizationSplit(balance: number, annualRatePct: number, paymentAmount: number): AmortizationSplit {
  const monthlyRate = annualRatePct / 100 / 12
  const interest = round2(Math.min(balance * monthlyRate, paymentAmount))
  const principal = round2(Math.max(0, paymentAmount - interest))
  const newBalance = round2(Math.max(0, balance - principal))
  return { interest, principal, newBalance }
}
