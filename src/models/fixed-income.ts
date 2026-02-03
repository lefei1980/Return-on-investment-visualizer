import type { InvestmentAsset, FixedIncomeParams } from './types'

/**
 * Deterministic fixed-income model for treasury bills, notes, CDs, etc.
 *
 * Year 0 = principal.
 *
 * Simple interest:  value[t] = principal * (1 + yield * t)
 * Annual compound:  value[t] = principal * (1 + yield)^t
 *
 * After maturity the value flatlines unless reinvestAtMaturity is true,
 * in which case the matured amount rolls into a new term at the same rate.
 *
 * MVP assumptions:
 * - Constant annual yield (no rate changes at reinvestment)
 * - No early withdrawal penalties
 * - No taxes or fees
 */
export function computeFixedIncomeValues(params: FixedIncomeParams, years: number): number[] {
  const { principal, annualYield, maturityYears, compoundingMethod, reinvestAtMaturity } = params

  const values: number[] = [principal]

  for (let year = 1; year <= years; year++) {
    let value: number

    if (compoundingMethod === 'simple') {
      if (reinvestAtMaturity) {
        // Each maturity cycle: principal grows by (1 + yield * M), then rolls over
        const completedCycles = Math.floor(year / maturityYears)
        const remainder = year % maturityYears
        const cycleMultiplier = 1 + annualYield * maturityYears
        value = principal * Math.pow(cycleMultiplier, completedCycles) * (1 + annualYield * remainder)
      } else {
        // Flatline after maturity
        const effectiveYears = Math.min(year, maturityYears)
        value = principal * (1 + annualYield * effectiveYears)
      }
    } else {
      // Annual compounding
      if (reinvestAtMaturity) {
        // Mathematically equivalent to continuous compounding at the same rate
        value = principal * Math.pow(1 + annualYield, year)
      } else {
        // Flatline after maturity
        const effectiveYears = Math.min(year, maturityYears)
        value = principal * Math.pow(1 + annualYield, effectiveYears)
      }
    }

    values.push(value)
  }

  return values
}

export function createFixedIncomeAsset(id: string, params: FixedIncomeParams): InvestmentAsset {
  return {
    id,
    name: params.name,
    type: 'fixed-income',
    computeValueOverTime(years: number): number[] {
      return computeFixedIncomeValues(params, years)
    },
  }
}
