import { useState } from 'react'
import type { RentalPropertyParams } from '../models/types'
import { validateRentalParams } from '../models/validation'
import { Field, PercentInput } from './FormComponents'

interface RentalPropertyFormProps {
  params: RentalPropertyParams
  onChange: (params: RentalPropertyParams) => void
  errors: Record<string, string>
}

export function RentalPropertyForm({ params, onChange, errors }: RentalPropertyFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  function update(patch: Partial<RentalPropertyParams>) {
    const next = { ...params, ...patch }
    onChange(next)
  }

  const validationErrors = validateRentalParams(params)
  const allErrors = { ...errors }
  for (const err of validationErrors) {
    if (!allErrors[err.field]) {
      allErrors[err.field] = err.message
    }
  }

  return (
    <div className="space-y-4">
      {/* Basic Inputs */}
      <div className="space-y-3">
        <Field label="Asset Name" error={allErrors.name}>
          <input
            type="text"
            value={params.name}
            onChange={e => update({ name: e.target.value })}
            placeholder="e.g. Rental Duplex"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field
          label="Purchase Price ($)"
          error={allErrors.purchasePrice}
          tooltip="Total property purchase price"
        >
          <input
            type="number"
            value={params.purchasePrice}
            onChange={e => update({ purchasePrice: parseFloat(e.target.value) || 0 })}
            min={0}
            step={10000}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field
          label="Down Payment ($)"
          error={allErrors.downPayment}
          tooltip="Upfront cash payment. Typical: 20% of purchase price"
        >
          <input
            type="number"
            value={params.downPayment}
            onChange={e => update({ downPayment: parseFloat(e.target.value) || 0 })}
            min={0}
            step={5000}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field
          label="Mortgage Interest Rate (%)"
          error={allErrors.mortgageRate}
          tooltip="Annual mortgage interest rate (APR)"
        >
          <PercentInput
            value={params.mortgageRate}
            onChange={v => update({ mortgageRate: v })}
            step={0.25}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field
          label="Mortgage Duration (years)"
          error={allErrors.mortgageDuration}
          tooltip="Length of the mortgage loan. Common: 15 or 30 years"
        >
          <input
            type="number"
            value={params.mortgageDuration}
            onChange={e => update({ mortgageDuration: parseInt(e.target.value) || 0 })}
            min={1}
            max={50}
            step={1}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field
          label="Monthly Rental Income ($)"
          error={allErrors.monthlyRentalIncome}
          tooltip="Expected monthly rent collected from tenants"
        >
          <input
            type="number"
            value={params.monthlyRentalIncome}
            onChange={e => update({ monthlyRentalIncome: parseFloat(e.target.value) || 0 })}
            min={0}
            step={100}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field
          label="Annual Property Appreciation (%)"
          error={allErrors.annualAppreciation}
          tooltip="Expected yearly increase in property value. US average: ~3-4%"
        >
          <PercentInput
            value={params.annualAppreciation}
            onChange={v => update({ annualAppreciation: v })}
            step={0.5}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field
          label="Time Horizon (years)"
          error={allErrors.timeHorizon}
          tooltip="How many years you plan to hold this property"
        >
          <input
            type="number"
            value={params.timeHorizon}
            onChange={e => update({ timeHorizon: parseInt(e.target.value) || 0 })}
            min={1}
            max={100}
            step={1}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>
      </div>

      {/* Advanced Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
      >
        {showAdvanced ? '▾ Hide' : '▸ Show'} Advanced Options
      </button>

      {/* Advanced Inputs */}
      {showAdvanced && (
        <div className="space-y-3 pl-3 border-l-2 border-gray-200">
          <Field
            label="Maintenance Cost (% of property value)"
            error={allErrors.maintenanceCostPercent}
            tooltip="Annual maintenance and repair costs as a percentage of property value. Typical: 1%"
          >
            <PercentInput
              value={params.maintenanceCostPercent}
              onChange={v => update({ maintenanceCostPercent: v })}
              min={0}
              step={0.1}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>

          <Field
            label="Insurance Cost ($/year)"
            error={allErrors.insuranceCost}
            tooltip="Annual property insurance premium"
          >
            <input
              type="number"
              value={params.insuranceCost}
              onChange={e => update({ insuranceCost: parseFloat(e.target.value) || 0 })}
              min={0}
              step={100}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>

          <Field
            label="Property Tax Rate (%)"
            error={allErrors.propertyTaxRate}
            tooltip="Annual property tax as percentage of property value. US average: ~1.1%"
          >
            <PercentInput
              value={params.propertyTaxRate}
              onChange={v => update({ propertyTaxRate: v })}
              min={0}
              step={0.1}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>

          <Field
            label="Vacancy Rate (%)"
            error={allErrors.vacancyRate}
            tooltip="Expected percentage of time the property is vacant. Typical: 5-10%"
          >
            <PercentInput
              value={params.vacancyRate}
              onChange={v => update({ vacancyRate: v })}
              min={0}
              step={1}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>

          <Field
            label="Selling Transaction Cost (%)"
            error={allErrors.sellingCostPercent}
            tooltip="Cost of selling as percentage of property value (realtor fees, closing costs). Typical: 6%"
          >
            <PercentInput
              value={params.sellingCostPercent}
              onChange={v => update({ sellingCostPercent: v })}
              min={0}
              step={0.5}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
        </div>
      )}
    </div>
  )
}
