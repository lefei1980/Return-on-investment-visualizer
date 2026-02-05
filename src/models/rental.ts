import type { InvestmentAsset, RentalPropertyParams } from './types'

/**
 * Deterministic annual model for rental property investments.
 *
 * MVP Assumptions (documented per CLAUDE.md):
 * - Annualized mortgage payments: monthly payment computed via standard
 *   amortization formula, then multiplied by 12 for annual cost.
 * - Rental income and insurance scale with property value (percentage-based).
 * - No refinancing, income taxes, or tax deductions.
 *
 * Total value each year = equity + cumulative net cash flow
 *   where equity = property value - remaining mortgage - selling costs
 *   and net cash flow = rental income - mortgage payment - expenses
 */
export function computeRentalValues(params: RentalPropertyParams, years: number): number[] {
  const {
    purchasePrice,
    downPayment,
    mortgageRate,
    mortgageDuration,
    monthlyRentalPercent,
    annualAppreciation,
    maintenanceCostPercent,
    annualInsuranceCostPercent,
    propertyTaxRate,
    vacancyRate,
    sellingCostPercent,
  } = params

  const mortgageAmount = purchasePrice - downPayment

  // Compute annual mortgage payment using standard amortization formula.
  // Monthly payment = P * r * (1+r)^n / ((1+r)^n - 1)
  // where P = principal, r = monthly rate, n = total months
  // Annual payment = monthly payment * 12
  let annualMortgagePayment: number
  if (mortgageAmount <= 0) {
    annualMortgagePayment = 0
  } else if (mortgageRate === 0) {
    // Zero-interest: simply divide principal by total months
    annualMortgagePayment = (mortgageAmount / (mortgageDuration * 12)) * 12
  } else {
    const monthlyRate = mortgageRate / 12
    const totalMonths = mortgageDuration * 12
    const factor = Math.pow(1 + monthlyRate, totalMonths)
    const monthlyPayment = mortgageAmount * (monthlyRate * factor) / (factor - 1)
    annualMortgagePayment = monthlyPayment * 12
  }

  // Year 0: initial cash invested = down payment
  const values: number[] = [downPayment]

  let propertyValue = purchasePrice
  let remainingMortgage = mortgageAmount
  let cumulativeCashFlow = 0

  for (let year = 1; year <= years; year++) {
    // Property appreciates
    propertyValue = propertyValue * (1 + annualAppreciation)

    // Mortgage payment and balance update.
    // Payment is made each year within the mortgage duration.
    // Balance tracks remaining principal via annualized amortization.
    let mortgagePaymentThisYear = 0
    if (year <= mortgageDuration && mortgageAmount > 0) {
      mortgagePaymentThisYear = annualMortgagePayment
      const interestThisYear = remainingMortgage * mortgageRate
      const principalThisYear = Math.min(
        annualMortgagePayment - interestThisYear,
        remainingMortgage
      )
      remainingMortgage = Math.max(remainingMortgage - principalThisYear, 0)
    }

    // Annual expenses based on current property value
    const maintenance = propertyValue * maintenanceCostPercent
    const propertyTax = propertyValue * propertyTaxRate
    const insurance = propertyValue * annualInsuranceCostPercent
    const totalExpenses = maintenance + insurance + propertyTax

    // Effective rental income adjusted for vacancy
    const effectiveRentalIncome = propertyValue * monthlyRentalPercent * 12 * (1 - vacancyRate)

    // Net cash flow = income - mortgage payment - expenses
    const netCashFlow = effectiveRentalIncome - mortgagePaymentThisYear - totalExpenses
    cumulativeCashFlow += netCashFlow

    // Equity = property value - remaining mortgage - selling costs
    const sellingCosts = propertyValue * sellingCostPercent
    const equity = propertyValue - remainingMortgage - sellingCosts

    // Total value = equity + cumulative net cash flow
    values.push(equity + cumulativeCashFlow)
  }

  return values
}

export function createRentalAsset(id: string, params: RentalPropertyParams): InvestmentAsset {
  return {
    id,
    name: params.name,
    type: 'rental-property',
    computeValueOverTime(years: number): number[] {
      return computeRentalValues(params, years)
    },
  }
}
