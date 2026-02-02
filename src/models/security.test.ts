import { describe, it, expect } from 'vitest'
import { computeSecurityValues } from './security'
import { validateSecurityParams } from './validation'
import type { SecurityParams } from './types'

const baseParams: SecurityParams = {
  name: 'Test Security',
  initialInvestment: 10000,
  annualReturn: 0.1,
  timeHorizon: 10,
  expenseRatio: 0,
  oneTimeFee: 0,
  dividendYield: 0,
  reinvestDividends: true,
}

describe('computeSecurityValues', () => {
  it('returns correct length (years + 1 for year 0)', () => {
    const values = computeSecurityValues(baseParams, 10)
    expect(values).toHaveLength(11)
  })

  it('year 0 equals initial investment', () => {
    const values = computeSecurityValues(baseParams, 5)
    expect(values[0]).toBe(10000)
  })

  it('computes simple compound interest correctly', () => {
    const values = computeSecurityValues(baseParams, 3)
    // 10000 * 1.1 = 11000
    // 11000 * 1.1 = 12100
    // 12100 * 1.1 = 13310
    expect(values[1]).toBeCloseTo(11000, 2)
    expect(values[2]).toBeCloseTo(12100, 2)
    expect(values[3]).toBeCloseTo(13310, 2)
  })

  it('deducts one-time fee from starting value', () => {
    const params = { ...baseParams, oneTimeFee: 500 }
    const values = computeSecurityValues(params, 1)
    expect(values[0]).toBe(9500)
    expect(values[1]).toBeCloseTo(9500 * 1.1, 2)
  })

  it('applies expense ratio as reduction to growth rate', () => {
    const params = { ...baseParams, expenseRatio: 0.01 }
    const values = computeSecurityValues(params, 1)
    // Net rate = 0.10 - 0.01 = 0.09
    expect(values[1]).toBeCloseTo(10000 * 1.09, 2)
  })

  it('handles zero annual return (no growth)', () => {
    const params = { ...baseParams, annualReturn: 0 }
    const values = computeSecurityValues(params, 5)
    for (const v of values) {
      expect(v).toBeCloseTo(10000, 2)
    }
  })

  it('handles zero years', () => {
    const values = computeSecurityValues(baseParams, 0)
    expect(values).toHaveLength(1)
    expect(values[0]).toBe(10000)
  })

  it('reinvests dividends when enabled', () => {
    const params = { ...baseParams, dividendYield: 0.02, reinvestDividends: true }
    const values = computeSecurityValues(params, 1)
    // Net rate = 0.10 + 0.02 = 0.12
    expect(values[1]).toBeCloseTo(10000 * 1.12, 2)
  })

  it('accumulates dividends as cash when reinvestment disabled', () => {
    const params = { ...baseParams, dividendYield: 0.02, reinvestDividends: false }
    const values = computeSecurityValues(params, 2)
    // Year 1: compounded = 10000 * 1.10 = 11000, dividends = 10000 * 0.02 = 200
    // Total year 1 = 11000 + 200 = 11200
    expect(values[1]).toBeCloseTo(11200, 2)
    // Year 2: compounded = 11000 * 1.10 = 12100, dividends = 200 + 11000 * 0.02 = 420
    // Total year 2 = 12100 + 420 = 12520
    expect(values[2]).toBeCloseTo(12520, 2)
  })

  it('handles zero-cost stock (no fees, no expenses)', () => {
    const params: SecurityParams = {
      name: 'Zero Cost',
      initialInvestment: 5000,
      annualReturn: 0.08,
      timeHorizon: 20,
      expenseRatio: 0,
      oneTimeFee: 0,
      dividendYield: 0,
      reinvestDividends: true,
    }
    const values = computeSecurityValues(params, 20)
    // 5000 * (1.08)^20 = 23304.79
    expect(values[20]).toBeCloseTo(5000 * Math.pow(1.08, 20), 2)
  })
})

describe('validateSecurityParams', () => {
  it('returns no errors for valid params', () => {
    const errors = validateSecurityParams(baseParams)
    expect(errors).toHaveLength(0)
  })

  it('rejects negative initial investment', () => {
    const errors = validateSecurityParams({ ...baseParams, initialInvestment: -100 })
    expect(errors.some(e => e.field === 'initialInvestment')).toBe(true)
  })

  it('rejects annual return below -100%', () => {
    const errors = validateSecurityParams({ ...baseParams, annualReturn: -1.5 })
    expect(errors.some(e => e.field === 'annualReturn')).toBe(true)
  })

  it('allows negative annual return above -100%', () => {
    const errors = validateSecurityParams({ ...baseParams, annualReturn: -0.5 })
    expect(errors.some(e => e.field === 'annualReturn')).toBe(false)
  })

  it('rejects zero time horizon', () => {
    const errors = validateSecurityParams({ ...baseParams, timeHorizon: 0 })
    expect(errors.some(e => e.field === 'timeHorizon')).toBe(true)
  })

  it('rejects non-integer time horizon', () => {
    const errors = validateSecurityParams({ ...baseParams, timeHorizon: 5.5 })
    expect(errors.some(e => e.field === 'timeHorizon')).toBe(true)
  })

  it('rejects negative expense ratio', () => {
    const errors = validateSecurityParams({ ...baseParams, expenseRatio: -0.01 })
    expect(errors.some(e => e.field === 'expenseRatio')).toBe(true)
  })

  it('rejects expense ratio over 100%', () => {
    const errors = validateSecurityParams({ ...baseParams, expenseRatio: 1.5 })
    expect(errors.some(e => e.field === 'expenseRatio')).toBe(true)
  })

  it('rejects one-time fee exceeding initial investment', () => {
    const errors = validateSecurityParams({ ...baseParams, oneTimeFee: 20000 })
    expect(errors.some(e => e.field === 'oneTimeFee')).toBe(true)
  })

  it('rejects negative dividend yield', () => {
    const errors = validateSecurityParams({ ...baseParams, dividendYield: -0.01 })
    expect(errors.some(e => e.field === 'dividendYield')).toBe(true)
  })
})
