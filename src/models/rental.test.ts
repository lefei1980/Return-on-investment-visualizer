import { describe, it, expect } from 'vitest'
import { computeRentalValues } from './rental'
import { validateRentalParams } from './validation'
import type { RentalPropertyParams } from './types'

const baseParams: RentalPropertyParams = {
  name: 'Test Rental',
  purchasePrice: 300000,
  downPayment: 60000,
  mortgageRate: 0.06,
  mortgageDuration: 30,
  monthlyRentalIncome: 2000,
  annualAppreciation: 0.03,
  timeHorizon: 30,
  maintenanceCostPercent: 0,
  insuranceCost: 0,
  propertyTaxRate: 0,
  vacancyRate: 0,
  sellingCostPercent: 0,
}

describe('computeRentalValues', () => {
  it('returns correct length (years + 1 for year 0)', () => {
    const values = computeRentalValues(baseParams, 10)
    expect(values).toHaveLength(11)
  })

  it('year 0 equals down payment', () => {
    const values = computeRentalValues(baseParams, 5)
    expect(values[0]).toBe(60000)
  })

  it('handles zero years', () => {
    const values = computeRentalValues(baseParams, 0)
    expect(values).toHaveLength(1)
    expect(values[0]).toBe(60000)
  })

  it('computes zero appreciation correctly (flat property value)', () => {
    const params: RentalPropertyParams = {
      ...baseParams,
      annualAppreciation: 0,
      mortgageRate: 0,
      monthlyRentalIncome: 0,
    }
    // With zero appreciation, zero rent, zero rate:
    // mortgage amount = 240000, annual payment = 240000/30 = 8000
    // Year 1: property = 300000, remaining = 240000 - 8000 = 232000
    //   equity = 300000 - 232000 = 68000
    //   cash flow = 0 - 8000 = -8000
    //   total = 68000 + (-8000) = 60000
    // Value should stay flat because we're just shifting money from cash to equity
    const values = computeRentalValues(params, 3)
    for (const v of values) {
      expect(v).toBeCloseTo(60000, 0)
    }
  })

  it('tracks mortgage balance decrease with known amortization', () => {
    // Simple case: no appreciation, no rent, no expenses, zero selling cost
    // Just track that equity grows as mortgage is paid down
    const params: RentalPropertyParams = {
      ...baseParams,
      annualAppreciation: 0,
      monthlyRentalIncome: 0,
      mortgageRate: 0.06,
      mortgageDuration: 30,
      sellingCostPercent: 0,
    }
    const values = computeRentalValues(params, 1)
    // Mortgage amount = 240000
    // Monthly rate = 0.005, total months = 360
    // Monthly payment = 240000 * 0.005 * 1.005^360 / (1.005^360 - 1)
    const monthlyRate = 0.06 / 12
    const factor = Math.pow(1 + monthlyRate, 360)
    const monthlyPayment = 240000 * (monthlyRate * factor) / (factor - 1)
    const annualPayment = monthlyPayment * 12

    // Year 1: interest = 240000 * 0.06 = 14400
    // Principal = annualPayment - 14400
    // Remaining = 240000 - principal
    const interest1 = 240000 * 0.06
    const principal1 = annualPayment - interest1
    const remaining1 = 240000 - principal1

    // Equity = 300000 - remaining1, cash flow = 0 - annualPayment
    const equity1 = 300000 - remaining1
    const cashFlow1 = -annualPayment
    expect(values[1]).toBeCloseTo(equity1 + cashFlow1, 0)
  })

  it('handles zero rental income (pure equity play)', () => {
    const params: RentalPropertyParams = {
      ...baseParams,
      monthlyRentalIncome: 0,
      maintenanceCostPercent: 0,
      insuranceCost: 0,
      propertyTaxRate: 0,
    }
    const values = computeRentalValues(params, 1)
    // Should still have a value from equity, but negative cash flow from mortgage
    expect(values[1]).toBeDefined()
    // Cash flow is negative (only mortgage payment, no income)
    // But equity should be positive (property value - remaining mortgage)
  })

  it('handles full vacancy (no rental income)', () => {
    const params: RentalPropertyParams = {
      ...baseParams,
      vacancyRate: 1, // 100% vacancy
    }
    const valuesFullVacancy = computeRentalValues(params, 5)
    const paramsNoVacancy = { ...baseParams, vacancyRate: 0 }
    const valuesNoVacancy = computeRentalValues(paramsNoVacancy, 5)

    // Full vacancy should yield lower total values (no rental income)
    for (let i = 1; i <= 5; i++) {
      expect(valuesFullVacancy[i]).toBeLessThan(valuesNoVacancy[i])
    }
  })

  it('selling cost reduces total value', () => {
    const paramsNoSelling = { ...baseParams, sellingCostPercent: 0 }
    const paramsWithSelling = { ...baseParams, sellingCostPercent: 0.06 }
    const valuesNoSelling = computeRentalValues(paramsNoSelling, 5)
    const valuesWithSelling = computeRentalValues(paramsWithSelling, 5)

    for (let i = 1; i <= 5; i++) {
      expect(valuesWithSelling[i]).toBeLessThan(valuesNoSelling[i])
    }
  })

  it('property appreciation increases value over time', () => {
    const params: RentalPropertyParams = {
      ...baseParams,
      annualAppreciation: 0.05,
      mortgageRate: 0,
      monthlyRentalIncome: 0,
    }
    const values = computeRentalValues(params, 5)
    // With appreciation and no costs, values should increase
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1])
    }
  })

  it('handles fully paid property (down payment = purchase price)', () => {
    const params: RentalPropertyParams = {
      ...baseParams,
      downPayment: 300000, // No mortgage
      mortgageRate: 0.06,
    }
    const values = computeRentalValues(params, 1)
    // Year 0 = 300000 (down payment = full purchase)
    expect(values[0]).toBe(300000)
    // Year 1: property = 300000 * 1.03 = 309000, no mortgage, no expenses
    // Equity = 309000, cash flow = 2000*12 = 24000
    // Total = 309000 + 24000 = 333000
    expect(values[1]).toBeCloseTo(333000, 0)
  })
})

describe('validateRentalParams', () => {
  it('returns no errors for valid params', () => {
    const errors = validateRentalParams(baseParams)
    expect(errors).toHaveLength(0)
  })

  it('rejects negative purchase price', () => {
    const errors = validateRentalParams({ ...baseParams, purchasePrice: -100 })
    expect(errors.some(e => e.field === 'purchasePrice')).toBe(true)
  })

  it('rejects down payment exceeding purchase price', () => {
    const errors = validateRentalParams({ ...baseParams, downPayment: 400000 })
    expect(errors.some(e => e.field === 'downPayment')).toBe(true)
  })

  it('rejects negative down payment', () => {
    const errors = validateRentalParams({ ...baseParams, downPayment: -1000 })
    expect(errors.some(e => e.field === 'downPayment')).toBe(true)
  })

  it('rejects zero time horizon', () => {
    const errors = validateRentalParams({ ...baseParams, timeHorizon: 0 })
    expect(errors.some(e => e.field === 'timeHorizon')).toBe(true)
  })

  it('rejects non-integer time horizon', () => {
    const errors = validateRentalParams({ ...baseParams, timeHorizon: 5.5 })
    expect(errors.some(e => e.field === 'timeHorizon')).toBe(true)
  })

  it('rejects negative mortgage rate', () => {
    const errors = validateRentalParams({ ...baseParams, mortgageRate: -0.01 })
    expect(errors.some(e => e.field === 'mortgageRate')).toBe(true)
  })

  it('rejects mortgage rate over 100%', () => {
    const errors = validateRentalParams({ ...baseParams, mortgageRate: 1.5 })
    expect(errors.some(e => e.field === 'mortgageRate')).toBe(true)
  })

  it('rejects zero mortgage duration', () => {
    const errors = validateRentalParams({ ...baseParams, mortgageDuration: 0 })
    expect(errors.some(e => e.field === 'mortgageDuration')).toBe(true)
  })

  it('rejects non-integer mortgage duration', () => {
    const errors = validateRentalParams({ ...baseParams, mortgageDuration: 15.5 })
    expect(errors.some(e => e.field === 'mortgageDuration')).toBe(true)
  })

  it('rejects vacancy rate over 100%', () => {
    const errors = validateRentalParams({ ...baseParams, vacancyRate: 1.5 })
    expect(errors.some(e => e.field === 'vacancyRate')).toBe(true)
  })

  it('rejects annual appreciation below -100%', () => {
    const errors = validateRentalParams({ ...baseParams, annualAppreciation: -1.5 })
    expect(errors.some(e => e.field === 'annualAppreciation')).toBe(true)
  })

  it('allows negative appreciation above -100%', () => {
    const errors = validateRentalParams({ ...baseParams, annualAppreciation: -0.5 })
    expect(errors.some(e => e.field === 'annualAppreciation')).toBe(false)
  })
})
