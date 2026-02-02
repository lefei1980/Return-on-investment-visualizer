import { useState, useEffect, useRef } from 'react'

/**
 * A number input for percentage values that stores decimals internally
 * (e.g. 0.001 for 0.1%) but displays/edits as percentages (e.g. "0.10").
 * Uses local string state while focused so the round-trip conversion
 * doesn't reformat the input mid-edit.
 */
export function PercentInput({
  value,
  onChange,
  ...inputProps
}: {
  value: number
  onChange: (decimal: number) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  const [localValue, setLocalValue] = useState(() => (value * 100).toFixed(2))
  const isFocused = useRef(false)

  // Sync from props when not focused (e.g. external reset)
  useEffect(() => {
    if (!isFocused.current) {
      setLocalValue((value * 100).toFixed(2))
    }
  }, [value])

  return (
    <input
      type="number"
      value={localValue}
      onChange={e => {
        setLocalValue(e.target.value)
        const parsed = parseFloat(e.target.value)
        if (!isNaN(parsed)) {
          onChange(parsed / 100)
        }
      }}
      onFocus={() => { isFocused.current = true }}
      onBlur={() => {
        isFocused.current = false
        // Reformat on blur
        const parsed = parseFloat(localValue)
        if (isNaN(parsed)) {
          setLocalValue((value * 100).toFixed(2))
        } else {
          onChange(parsed / 100)
          setLocalValue(parsed.toFixed(2))
        }
      }}
      {...inputProps}
    />
  )
}

export function Field({
  label,
  tooltip,
  error,
  children,
}: {
  label: string
  tooltip?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {tooltip && (
          <span className="ml-1 text-gray-400 cursor-help" title={tooltip}>
            ⓘ
          </span>
        )}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
