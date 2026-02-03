import { describe, it, expect } from 'vitest'
import { computeFixedIncomeValues } from './fixed-income'
import { validateFixedIncomeParams } from './validation'
import type { FixedIncomeParams } from './types'

const baseParams: FixedIncomeParams = {
  name: 'Test CD',
  principal: 10000,
  annualYield: 0.05,
  maturityYears: 5,
  compoundingMethod: 'annual',
  reinvestAtMaturity: false,
  timeHorizon: 10,
}

describe('computeFixedIncomeValues', () => {
  it('returns correct length (years + 1 for year 0)', () => {
    const values = computeFixedIncomeValues(baseParams, 10)
    expect(values).toHaveLength(11)
  })

  it('year 0 equals principal', () => {
    const values = computeFixedIncomeValues(baseParams, 5)
    expect(values[0]).toBe(10000)
  })

  // --- Simple interest ---

  it('simple interest: value[t] = principal * (1 + yield * t)', () => {
    const params = { ...baseParams, compoundingMethod: 'simple' as const }
    const values = computeFixedIncomeValues(params, 3)
    expect(values[1]).toBeCloseTo(10000 * (1 + 0.05 * 1), 2)
    expect(values[2]).toBeCloseTo(10000 * (1 + 0.05 * 2), 2)
    expect(values[3]).toBeCloseTo(10000 * (1 + 0.05 * 3), 2)
  })

  it('simple interest: flatlines after maturity without reinvestment', () => {
    const params = { ...baseParams, compoundingMethod: 'simple' as const, maturityYears: 3 }
    const values = computeFixedIncomeValues(params, 6)
    const maturityValue = 10000 * (1 + 0.05 * 3)
    expect(values[3]).toBeCloseTo(maturityValue, 2)
    expect(values[4]).toBeCloseTo(maturityValue, 2)
    expect(values[5]).toBeCloseTo(maturityValue, 2)
    expect(values[6]).toBeCloseTo(maturityValue, 2)
  })

  it('simple interest with reinvestment: rolls over at maturity', () => {
    const params = {
      ...baseParams,
      compoundingMethod: 'simple' as const,
      maturityYears: 5,
      reinvestAtMaturity: true,
    }
    const values = computeFixedIncomeValues(params, 10)
    // At year 5 (end of first cycle): 10000 * (1 + 0.05 * 5) = 12500
    expect(values[5]).toBeCloseTo(12500, 2)
    // At year 10 (end of second cycle): 12500 * (1 + 0.05 * 5) = 15625
    expect(values[10]).toBeCloseTo(15625, 2)
    // Mid-cycle at year 7: 12500 * (1 + 0.05 * 2) = 13750
    expect(values[7]).toBeCloseTo(13750, 2)
  })

  // --- Annual compounding ---

  it('annual compounding: value[t] = principal * (1 + yield)^t', () => {
    const values = computeFixedIncomeValues(baseParams, 3)
    expect(values[1]).toBeCloseTo(10000 * Math.pow(1.05, 1), 2)
    expect(values[2]).toBeCloseTo(10000 * Math.pow(1.05, 2), 2)
    expect(values[3]).toBeCloseTo(10000 * Math.pow(1.05, 3), 2)
  })

  it('annual compounding: flatlines after maturity without reinvestment', () => {
    const params = { ...baseParams, maturityYears: 3 }
    const values = computeFixedIncomeValues(params, 6)
    const maturityValue = 10000 * Math.pow(1.05, 3)
    expect(values[3]).toBeCloseTo(maturityValue, 2)
    expect(values[4]).toBeCloseTo(maturityValue, 2)
    expect(values[5]).toBeCloseTo(maturityValue, 2)
    expect(values[6]).toBeCloseTo(maturityValue, 2)
  })

  it('annual compounding with reinvestment: continuous growth', () => {
    const params = { ...baseParams, reinvestAtMaturity: true }
    const values = computeFixedIncomeValues(params, 10)
    // Equivalent to principal * (1 + yield)^t for all t
    expect(values[5]).toBeCloseTo(10000 * Math.pow(1.05, 5), 2)
    expect(values[10]).toBeCloseTo(10000 * Math.pow(1.05, 10), 2)
  })

  // --- Edge cases ---

  it('handles zero yield (no growth)', () => {
    const params = { ...baseParams, annualYield: 0 }
    const values = computeFixedIncomeValues(params, 5)
    for (const v of values) {
      expect(v).toBeCloseTo(10000, 2)
    }
  })

  it('handles zero years', () => {
    const values = computeFixedIncomeValues(baseParams, 0)
    expect(values).toHaveLength(1)
    expect(values[0]).toBe(10000)
  })

  it('handles maturity of 1 year with simple interest reinvestment', () => {
    const params = {
      ...baseParams,
      compoundingMethod: 'simple' as const,
      maturityYears: 1,
      reinvestAtMaturity: true,
    }
    const values = computeFixedIncomeValues(params, 3)
    // Each year is a full cycle: principal * (1 + yield)^cycles
    // Year 1: 10000 * (1.05)^1 = 10500
    // Year 2: 10000 * (1.05)^2 = 11025
    // Year 3: 10000 * (1.05)^3 = 11576.25
    expect(values[1]).toBeCloseTo(10500, 2)
    expect(values[2]).toBeCloseTo(11025, 2)
    expect(values[3]).toBeCloseTo(11576.25, 2)
  })
})

describe('validateFixedIncomeParams', () => {
  it('returns no errors for valid params', () => {
    const errors = validateFixedIncomeParams(baseParams)
    expect(errors).toHaveLength(0)
  })

  it('rejects negative principal', () => {
    const errors = validateFixedIncomeParams({ ...baseParams, principal: -100 })
    expect(errors.some(e => e.field === 'principal')).toBe(true)
  })

  it('rejects annual yield below -100%', () => {
    const errors = validateFixedIncomeParams({ ...baseParams, annualYield: -1.5 })
    expect(errors.some(e => e.field === 'annualYield')).toBe(true)
  })

  it('allows negative annual yield above -100%', () => {
    const errors = validateFixedIncomeParams({ ...baseParams, annualYield: -0.5 })
    expect(errors.some(e => e.field === 'annualYield')).toBe(false)
  })

  it('rejects zero maturity', () => {
    const errors = validateFixedIncomeParams({ ...baseParams, maturityYears: 0 })
    expect(errors.some(e => e.field === 'maturityYears')).toBe(true)
  })

  it('rejects non-integer maturity', () => {
    const errors = validateFixedIncomeParams({ ...baseParams, maturityYears: 2.5 })
    expect(errors.some(e => e.field === 'maturityYears')).toBe(true)
  })

  it('rejects zero time horizon', () => {
    const errors = validateFixedIncomeParams({ ...baseParams, timeHorizon: 0 })
    expect(errors.some(e => e.field === 'timeHorizon')).toBe(true)
  })

  it('rejects non-integer time horizon', () => {
    const errors = validateFixedIncomeParams({ ...baseParams, timeHorizon: 5.5 })
    expect(errors.some(e => e.field === 'timeHorizon')).toBe(true)
  })
})
