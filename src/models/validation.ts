import type { SecurityParams, RentalPropertyParams, PreciousMetalParams, FixedIncomeParams } from './types'

export interface ValidationError {
  field: string
  message: string
}

/**
 * Model-layer validation for Security parameters.
 * Checks numeric bounds and domain constraints.
 * Returns an array of errors (empty = valid).
 */
export function validateSecurityParams(params: SecurityParams): ValidationError[] {
  const errors: ValidationError[] = []

  if (params.initialInvestment < 0) {
    errors.push({ field: 'initialInvestment', message: 'Initial investment must be non-negative' })
  }

  if (params.annualReturn < -1) {
    errors.push({ field: 'annualReturn', message: 'Annual return cannot be less than -100%' })
  }

  if (params.timeHorizon <= 0) {
    errors.push({ field: 'timeHorizon', message: 'Time horizon must be greater than 0' })
  }

  if (!Number.isInteger(params.timeHorizon)) {
    errors.push({ field: 'timeHorizon', message: 'Time horizon must be a whole number' })
  }

  if (params.expenseRatio < 0) {
    errors.push({ field: 'expenseRatio', message: 'Expense ratio must be non-negative' })
  }

  if (params.expenseRatio > 1) {
    errors.push({ field: 'expenseRatio', message: 'Expense ratio cannot exceed 100%' })
  }

  if (params.oneTimeFee < 0) {
    errors.push({ field: 'oneTimeFee', message: 'One-time fee must be non-negative' })
  }

  if (params.oneTimeFee > params.initialInvestment) {
    errors.push({ field: 'oneTimeFee', message: 'One-time fee cannot exceed initial investment' })
  }

  if (params.dividendYield < 0) {
    errors.push({ field: 'dividendYield', message: 'Dividend yield must be non-negative' })
  }

  if (params.dividendYield > 1) {
    errors.push({ field: 'dividendYield', message: 'Dividend yield cannot exceed 100%' })
  }

  return errors
}

/**
 * Model-layer validation for Rental Property parameters.
 * Checks numeric bounds and domain constraints.
 * Returns an array of errors (empty = valid).
 */
export function validateRentalParams(params: RentalPropertyParams): ValidationError[] {
  const errors: ValidationError[] = []

  if (params.purchasePrice < 0) {
    errors.push({ field: 'purchasePrice', message: 'Purchase price must be non-negative' })
  }

  if (params.downPayment < 0) {
    errors.push({ field: 'downPayment', message: 'Down payment must be non-negative' })
  }

  if (params.downPayment > params.purchasePrice) {
    errors.push({ field: 'downPayment', message: 'Down payment cannot exceed purchase price' })
  }

  if (params.mortgageRate < 0) {
    errors.push({ field: 'mortgageRate', message: 'Mortgage rate must be non-negative' })
  }

  if (params.mortgageRate > 1) {
    errors.push({ field: 'mortgageRate', message: 'Mortgage rate cannot exceed 100%' })
  }

  if (params.mortgageDuration <= 0) {
    errors.push({ field: 'mortgageDuration', message: 'Mortgage duration must be greater than 0' })
  }

  if (!Number.isInteger(params.mortgageDuration)) {
    errors.push({ field: 'mortgageDuration', message: 'Mortgage duration must be a whole number' })
  }

  if (params.monthlyRentalIncome < 0) {
    errors.push({ field: 'monthlyRentalIncome', message: 'Monthly rental income must be non-negative' })
  }

  if (params.annualAppreciation < -1) {
    errors.push({ field: 'annualAppreciation', message: 'Annual appreciation cannot be less than -100%' })
  }

  if (params.timeHorizon <= 0) {
    errors.push({ field: 'timeHorizon', message: 'Time horizon must be greater than 0' })
  }

  if (!Number.isInteger(params.timeHorizon)) {
    errors.push({ field: 'timeHorizon', message: 'Time horizon must be a whole number' })
  }

  if (params.maintenanceCostPercent < 0) {
    errors.push({ field: 'maintenanceCostPercent', message: 'Maintenance cost must be non-negative' })
  }

  if (params.maintenanceCostPercent > 1) {
    errors.push({ field: 'maintenanceCostPercent', message: 'Maintenance cost cannot exceed 100%' })
  }

  if (params.insuranceCost < 0) {
    errors.push({ field: 'insuranceCost', message: 'Insurance cost must be non-negative' })
  }

  if (params.propertyTaxRate < 0) {
    errors.push({ field: 'propertyTaxRate', message: 'Property tax rate must be non-negative' })
  }

  if (params.propertyTaxRate > 1) {
    errors.push({ field: 'propertyTaxRate', message: 'Property tax rate cannot exceed 100%' })
  }

  if (params.vacancyRate < 0) {
    errors.push({ field: 'vacancyRate', message: 'Vacancy rate must be non-negative' })
  }

  if (params.vacancyRate > 1) {
    errors.push({ field: 'vacancyRate', message: 'Vacancy rate cannot exceed 100%' })
  }

  if (params.sellingCostPercent < 0) {
    errors.push({ field: 'sellingCostPercent', message: 'Selling cost must be non-negative' })
  }

  if (params.sellingCostPercent > 1) {
    errors.push({ field: 'sellingCostPercent', message: 'Selling cost cannot exceed 100%' })
  }

  return errors
}

/**
 * Model-layer validation for Precious Metal parameters.
 * Checks numeric bounds and domain constraints.
 * Returns an array of errors (empty = valid).
 */
export function validatePreciousMetalParams(params: PreciousMetalParams): ValidationError[] {
  const errors: ValidationError[] = []

  if (params.initialInvestment < 0) {
    errors.push({ field: 'initialInvestment', message: 'Initial investment must be non-negative' })
  }

  if (params.annualPriceIncrease < -1) {
    errors.push({ field: 'annualPriceIncrease', message: 'Annual price increase cannot be less than -100%' })
  }

  if (params.timeHorizon <= 0) {
    errors.push({ field: 'timeHorizon', message: 'Time horizon must be greater than 0' })
  }

  if (!Number.isInteger(params.timeHorizon)) {
    errors.push({ field: 'timeHorizon', message: 'Time horizon must be a whole number' })
  }

  if (params.transactionFeePercent < 0) {
    errors.push({ field: 'transactionFeePercent', message: 'Transaction fee must be non-negative' })
  }

  if (params.transactionFeePercent > 1) {
    errors.push({ field: 'transactionFeePercent', message: 'Transaction fee cannot exceed 100%' })
  }

  return errors
}

/**
 * Model-layer validation for Fixed Income parameters.
 * Checks numeric bounds and domain constraints.
 * Returns an array of errors (empty = valid).
 */
export function validateFixedIncomeParams(params: FixedIncomeParams): ValidationError[] {
  const errors: ValidationError[] = []

  if (params.principal < 0) {
    errors.push({ field: 'principal', message: 'Principal must be non-negative' })
  }

  if (params.annualYield < -1) {
    errors.push({ field: 'annualYield', message: 'Annual yield cannot be less than -100%' })
  }

  if (params.maturityYears <= 0) {
    errors.push({ field: 'maturityYears', message: 'Maturity must be greater than 0' })
  }

  if (!Number.isInteger(params.maturityYears)) {
    errors.push({ field: 'maturityYears', message: 'Maturity must be a whole number' })
  }

  if (params.timeHorizon <= 0) {
    errors.push({ field: 'timeHorizon', message: 'Time horizon must be greater than 0' })
  }

  if (!Number.isInteger(params.timeHorizon)) {
    errors.push({ field: 'timeHorizon', message: 'Time horizon must be a whole number' })
  }

  return errors
}
