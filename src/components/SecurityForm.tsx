import { useState } from 'react'
import type { SecurityParams } from '../models/types'
import { validateSecurityParams } from '../models/validation'
import { Field, PercentInput } from './FormComponents'

interface SecurityFormProps {
  params: SecurityParams
  onChange: (params: SecurityParams) => void
  errors: Record<string, string>
}

export function SecurityForm({ params, onChange, errors }: SecurityFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  function update(patch: Partial<SecurityParams>) {
    const next = { ...params, ...patch }
    onChange(next)
  }

  const validationErrors = validateSecurityParams(params)
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
            placeholder="e.g. S&P 500 Index Fund"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field
          label="Initial Investment ($)"
          error={allErrors.initialInvestment}
          tooltip="The lump sum you invest at the start"
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
          label="Expected Annual Return (%)"
          error={allErrors.annualReturn}
          tooltip="Average yearly growth rate before fees. Historical S&P 500: ~10%"
        >
          <PercentInput
            value={params.annualReturn}
            onChange={v => update({ annualReturn: v })}
            step={0.5}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field
          label="Time Horizon (years)"
          error={allErrors.timeHorizon}
          tooltip="How many years you plan to hold this investment"
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
            label="Expense Ratio (%)"
            error={allErrors.expenseRatio}
            tooltip="Annual fund management fee. Low-cost index funds: ~0.03-0.10%"
          >
            <PercentInput
              value={params.expenseRatio}
              onChange={v => update({ expenseRatio: v })}
              min={0}
              step={0.01}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>

          <Field
            label="One-Time Fee ($)"
            error={allErrors.oneTimeFee}
            tooltip="Upfront purchase or transaction fee"
          >
            <input
              type="number"
              value={params.oneTimeFee}
              onChange={e => update({ oneTimeFee: parseFloat(e.target.value) || 0 })}
              min={0}
              step={10}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>

          <Field
            label="Dividend Yield (%)"
            error={allErrors.dividendYield}
            tooltip="Expected annual dividend payout as a percentage of asset value"
          >
            <PercentInput
              value={params.dividendYield}
              onChange={v => update({ dividendYield: v })}
              min={0}
              step={0.1}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>

          <Field label="Reinvest Dividends" error={allErrors.reinvestDividends}>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={params.reinvestDividends}
                onChange={e => update({ reinvestDividends: e.target.checked })}
                className="rounded"
              />
              <span>Automatically reinvest dividends</span>
            </label>
          </Field>
        </div>
      )}
    </div>
  )
}
