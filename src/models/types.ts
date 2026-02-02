export interface InvestmentAsset {
  id: string
  name: string
  type: 'security' | 'rental-property'
  computeValueOverTime(years: number): number[]
}

export interface SecurityParams {
  /** Display name for this investment */
  name: string
  /** Initial lump-sum investment amount in dollars */
  initialInvestment: number
  /** Expected annual return as a decimal (e.g. 0.07 for 7%) */
  annualReturn: number
  /** Investment time horizon in years */
  timeHorizon: number
  /** Annual expense ratio as a decimal (e.g. 0.001 for 0.1%) */
  expenseRatio: number
  /** One-time purchase fee in dollars */
  oneTimeFee: number
  /** Annual dividend yield as a decimal (e.g. 0.02 for 2%) */
  dividendYield: number
  /** Whether dividends are reinvested */
  reinvestDividends: boolean
}

export const DEFAULT_SECURITY_PARAMS: SecurityParams = {
  name: '',
  initialInvestment: 10000,
  annualReturn: 0.07,
  timeHorizon: 30,
  expenseRatio: 0.001,
  oneTimeFee: 0,
  dividendYield: 0,
  reinvestDividends: true,
}

export interface RentalPropertyParams {
  /** Display name for this investment */
  name: string
  /** Total property purchase price in dollars */
  purchasePrice: number
  /** Down payment amount in dollars */
  downPayment: number
  /** Annual mortgage interest rate as a decimal (e.g. 0.065 for 6.5%) */
  mortgageRate: number
  /** Mortgage term in years */
  mortgageDuration: number
  /** Monthly rental income in dollars */
  monthlyRentalIncome: number
  /** Expected annual property value appreciation as a decimal (e.g. 0.03 for 3%) */
  annualAppreciation: number
  /** Investment time horizon in years */
  timeHorizon: number
  /** Annual maintenance cost as a fraction of property value (e.g. 0.01 for 1%) */
  maintenanceCostPercent: number
  /** Annual insurance cost in dollars */
  insuranceCost: number
  /** Annual property tax as a fraction of property value (e.g. 0.012 for 1.2%) */
  propertyTaxRate: number
  /** Fraction of time property is vacant (e.g. 0.05 for 5%) */
  vacancyRate: number
  /** Selling transaction cost as a fraction of property value (e.g. 0.06 for 6%) */
  sellingCostPercent: number
}

export const DEFAULT_RENTAL_PARAMS: RentalPropertyParams = {
  name: '',
  purchasePrice: 300000,
  downPayment: 60000,
  mortgageRate: 0.065,
  mortgageDuration: 30,
  monthlyRentalIncome: 2000,
  annualAppreciation: 0.03,
  timeHorizon: 30,
  maintenanceCostPercent: 0.01,
  insuranceCost: 1500,
  propertyTaxRate: 0.012,
  vacancyRate: 0.05,
  sellingCostPercent: 0.06,
}
