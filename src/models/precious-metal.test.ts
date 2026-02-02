import { describe, it, expect } from 'vitest'
import { computePreciousMetalValues } from './precious-metal'
import { validatePreciousMetalParams } from './validation'
import type { PreciousMetalParams } from './types'

const baseParams: PreciousMetalParams = {
  name: 'Test Gold',
  initialInvestment: 10000,
  annualPriceIncrease: 0.05,
  timeHorizon: 10,
  transactionFeePercent: 0,
}

describe('computePreciousMetalValues', () => {
  it('returns correct length (years + 1 for year 0)', () => {
    const values = computePreciousMetalValues(baseParams, 10)
    expect(values).toHaveLength(11)
  })

  it('year 0 equals initial investment', () => {
    const values = computePreciousMetalValues(baseParams, 5)
    expect(values[0]).toBe(10000)
  })

  it('computes price appreciation correctly (no fees)', () => {
    const values = computePreciousMetalValues(baseParams, 3)
    // 10000 * 1.05^1 = 10500
    // 10000 * 1.05^2 = 11025
    // 10000 * 1.05^3 = 11576.25
    expect(values[1]).toBeCloseTo(10500, 2)
    expect(values[2]).toBeCloseTo(11025, 2)
    expect(values[3]).toBeCloseTo(11576.25, 2)
  })

  it('applies transaction fee to gross value', () => {
    const params = { ...baseParams, transactionFeePercent: 0.02 }
    const values = computePreciousMetalValues(params, 1)
    // Year 1: 10000 * 1.05 * (1 - 0.02) = 10500 * 0.98 = 10290
    expect(values[1]).toBeCloseTo(10290, 2)
  })

  it('does not apply transaction fee to year 0', () => {
    const params = { ...baseParams, transactionFeePercent: 0.10 }
    const values = computePreciousMetalValues(params, 1)
    expect(values[0]).toBe(10000)
  })

  it('handles zero price increase (flat value minus fees)', () => {
    const params = { ...baseParams, annualPriceIncrease: 0, transactionFeePercent: 0 }
    const values = computePreciousMetalValues(params, 5)
    for (const v of values) {
      expect(v).toBeCloseTo(10000, 2)
    }
  })

  it('handles zero years', () => {
    const values = computePreciousMetalValues(baseParams, 0)
    expect(values).toHaveLength(1)
    expect(values[0]).toBe(10000)
  })

  it('transaction fee can make short-term return negative', () => {
    const params = { ...baseParams, annualPriceIncrease: 0.01, transactionFeePercent: 0.05 }
    const values = computePreciousMetalValues(params, 1)
    // Year 1: 10000 * 1.01 * 0.95 = 9595
    expect(values[1]).toBeCloseTo(9595, 2)
    expect(values[1]).toBeLessThan(values[0])
  })

  it('computes long-term value correctly', () => {
    const values = computePreciousMetalValues(baseParams, 20)
    // 10000 * 1.05^20 ≈ 26532.98
    expect(values[20]).toBeCloseTo(10000 * Math.pow(1.05, 20), 2)
  })

  it('handles negative price change (depreciation)', () => {
    const params = { ...baseParams, annualPriceIncrease: -0.10, transactionFeePercent: 0 }
    const values = computePreciousMetalValues(params, 2)
    // 10000 * 0.9^1 = 9000
    // 10000 * 0.9^2 = 8100
    expect(values[1]).toBeCloseTo(9000, 2)
    expect(values[2]).toBeCloseTo(8100, 2)
  })
})

describe('validatePreciousMetalParams', () => {
  it('returns no errors for valid params', () => {
    const errors = validatePreciousMetalParams(baseParams)
    expect(errors).toHaveLength(0)
  })

  it('rejects negative initial investment', () => {
    const errors = validatePreciousMetalParams({ ...baseParams, initialInvestment: -100 })
    expect(errors.some(e => e.field === 'initialInvestment')).toBe(true)
  })

  it('rejects annual price increase below -100%', () => {
    const errors = validatePreciousMetalParams({ ...baseParams, annualPriceIncrease: -1.5 })
    expect(errors.some(e => e.field === 'annualPriceIncrease')).toBe(true)
  })

  it('allows negative price increase above -100%', () => {
    const errors = validatePreciousMetalParams({ ...baseParams, annualPriceIncrease: -0.5 })
    expect(errors.some(e => e.field === 'annualPriceIncrease')).toBe(false)
  })

  it('rejects zero time horizon', () => {
    const errors = validatePreciousMetalParams({ ...baseParams, timeHorizon: 0 })
    expect(errors.some(e => e.field === 'timeHorizon')).toBe(true)
  })

  it('rejects non-integer time horizon', () => {
    const errors = validatePreciousMetalParams({ ...baseParams, timeHorizon: 5.5 })
    expect(errors.some(e => e.field === 'timeHorizon')).toBe(true)
  })

  it('rejects negative transaction fee', () => {
    const errors = validatePreciousMetalParams({ ...baseParams, transactionFeePercent: -0.01 })
    expect(errors.some(e => e.field === 'transactionFeePercent')).toBe(true)
  })

  it('rejects transaction fee over 100%', () => {
    const errors = validatePreciousMetalParams({ ...baseParams, transactionFeePercent: 1.5 })
    expect(errors.some(e => e.field === 'transactionFeePercent')).toBe(true)
  })
})
