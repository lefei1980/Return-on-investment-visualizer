import type { InvestmentAsset, SecurityParams } from './types'

/**
 * Deterministic annual compounding model for securities (stocks/funds).
 *
 * Net return = annualReturn - expenseRatio
 * If reinvestDividends: net return += dividendYield
 * If !reinvestDividends: dividends are accumulated as cash (not compounded)
 *
 * One-time fee is deducted from the initial investment at year 0.
 */
export function computeSecurityValues(params: SecurityParams, years: number): number[] {
  const {
    initialInvestment,
    annualReturn,
    expenseRatio,
    oneTimeFee,
    dividendYield,
    reinvestDividends,
  } = params

  const startingValue = initialInvestment - oneTimeFee
  const values: number[] = [startingValue]

  const netGrowthRate = reinvestDividends
    ? annualReturn - expenseRatio + dividendYield
    : annualReturn - expenseRatio

  let compoundedValue = startingValue
  let accumulatedDividends = 0

  for (let year = 1; year <= years; year++) {
    compoundedValue = compoundedValue * (1 + netGrowthRate)

    if (!reinvestDividends) {
      // Dividends paid on the previous year's compounded value, not reinvested
      accumulatedDividends += (compoundedValue / (1 + netGrowthRate)) * dividendYield
    }

    values.push(compoundedValue + accumulatedDividends)
  }

  return values
}

export function createSecurityAsset(id: string, params: SecurityParams): InvestmentAsset {
  return {
    id,
    name: params.name,
    type: 'security',
    computeValueOverTime(years: number): number[] {
      return computeSecurityValues(params, years)
    },
  }
}
