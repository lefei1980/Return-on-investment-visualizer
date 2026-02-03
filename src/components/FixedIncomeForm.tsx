import { useState } from 'react'
import type { FixedIncomeParams } from '../models/types'
import { validateFixedIncomeParams } from '../models/validation'
import { Field, PercentInput } from './FormComponents'

interface FixedIncomeFormProps {
  params: FixedIncomeParams
  onChange: (params: FixedIncomeParams) => void
  errors: Record<string, string>
}

export function FixedIncomeForm({ params, onChange, errors }: FixedIncomeFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  function update(patch: Partial<FixedIncomeParams>) {
    const next = { ...params, ...patch }
    onChange(next)
  }

  const validationErrors = validateFixedIncomeParams(params)
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
            placeholder="e.g. 5-Year Treasury Note"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field
          label="Principal ($)"
          error={allErrors.principal}
          tooltip="The amount invested in this fixed-income instrument"
        >
          <input
            type="number"
            value={params.principal}
            onChange={e => update({ principal: parseFloat(e.target.value) || 0 })}
            min={0}
            step={1000}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field
          label="Annual Yield (%)"
          error={allErrors.annualYield}
          tooltip="The stated annual interest rate of the instrument"
        >
          <PercentInput
            value={params.annualYield}
            onChange={v => update({ annualYield: v })}
            step={0.1}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field
          label="Maturity (years)"
          error={allErrors.maturityYears}
          tooltip="The term length until the instrument matures"
        >
          <input
            type="number"
            value={params.maturityYears}
            onChange={e => update({ maturityYears: parseInt(e.target.value) || 0 })}
            min={1}
            max={100}
            step={1}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field
          label="Time Horizon (years)"
          error={allErrors.timeHorizon}
          tooltip="How many years to project this investment on the chart"
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
            label="Compounding Method"
            error={allErrors.compoundingMethod}
            tooltip="Simple interest accrues on principal only; annual compounding accrues on accumulated balance"
          >
            <select
              value={params.compoundingMethod}
              onChange={e => update({ compoundingMethod: e.target.value as 'simple' | 'annual' })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="annual">Annual Compounding</option>
              <option value="simple">Simple Interest</option>
            </select>
          </Field>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={params.reinvestAtMaturity}
              onChange={e => update({ reinvestAtMaturity: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Reinvest at maturity
            <span className="text-gray-400 cursor-help" title="When enabled, the matured amount (principal + interest) is automatically reinvested at the same rate for another term">
              ⓘ
            </span>
          </label>
        </div>
      )}
    </div>
  )
}
