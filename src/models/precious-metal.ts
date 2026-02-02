import type { InvestmentAsset, PreciousMetalParams } from './types'

/**
 * Deterministic annual price appreciation model for physical precious metals.
 *
 * Year 0 = initialInvestment (purchase cost, no selling fee).
 * Year N = initialInvestment * (1 + annualPriceIncrease)^N * (1 - transactionFeePercent)
 *
 * Shows net liquidation value at each year, accounting for selling costs.
 * Consistent with how rental properties deduct selling costs from equity.
 *
 * MVP assumptions:
 * - Constant annual price increase (no volatility)
 * - No storage or insurance costs
 * - Transaction fee applies only when selling
 */
export function computePreciousMetalValues(params: PreciousMetalParams, years: number): number[] {
  const { initialInvestment, annualPriceIncrease, transactionFeePercent } = params

  const values: number[] = [initialInvestment]

  for (let year = 1; year <= years; year++) {
    const grossValue = initialInvestment * Math.pow(1 + annualPriceIncrease, year)
    const netValue = grossValue * (1 - transactionFeePercent)
    values.push(netValue)
  }

  return values
}

export function createPreciousMetalAsset(id: string, params: PreciousMetalParams): InvestmentAsset {
  return {
    id,
    name: params.name,
    type: 'precious-metal',
    computeValueOverTime(years: number): number[] {
      return computePreciousMetalValues(params, years)
    },
  }
}
