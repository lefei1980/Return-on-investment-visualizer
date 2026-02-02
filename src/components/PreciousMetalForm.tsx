import { useState } from 'react'
import type { PreciousMetalParams } from '../models/types'
import { validatePreciousMetalParams } from '../models/validation'
import { Field, PercentInput } from './FormComponents'

interface PreciousMetalFormProps {
  params: PreciousMetalParams
  onChange: (params: PreciousMetalParams) => void
  errors: Record<string, string>
}

export function PreciousMetalForm({ params, onChange, errors }: PreciousMetalFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  function update(patch: Partial<PreciousMetalParams>) {
    const next = { ...params, ...patch }
    onChange(next)
  }

  const validationErrors = validatePreciousMetalParams(params)
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
            placeholder="e.g. Gold Bullion"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field
          label="Initial Investment ($)"
          error={allErrors.initialInvestment}
          tooltip="The total amount you spend purchasing the precious metal"
        >
          <input
            type="number"
            value={params.initialInvestment}
            onChange={e => update({ initialInvestment: parseFloat(e.target.value) || 0 })}
            min={0}
            step={1000}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field
          label="Annual Price Increase (%)"
          error={allErrors.annualPriceIncrease}
          tooltip="Expected nominal yearly increase in spot price. Historical gold average: ~5-7%"
        >
          <PercentInput
            value={params.annualPriceIncrease}
            onChange={v => update({ annualPriceIncrease: v })}
            step={0.5}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field
          label="Time Horizon (years)"
          error={allErrors.timeHorizon}
          tooltip="How many years you plan to hold this precious metal"
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
            label="Transaction/Selling Fee (%)"
            error={allErrors.transactionFeePercent}
            tooltip="Cost of selling (dealer spread, shipping, assay). Typical for gold: 1-3%"
          >
            <PercentInput
              value={params.transactionFeePercent}
              onChange={v => update({ transactionFeePercent: v })}
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
