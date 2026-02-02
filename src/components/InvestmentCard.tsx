import { useState } from 'react'
import type { SecurityParams, RentalPropertyParams } from '../models/types'
import { SecurityForm } from './SecurityForm'
import { RentalPropertyForm } from './RentalPropertyForm'

interface SecurityCardProps {
  id: string
  type: 'security'
  params: SecurityParams
  onChange: (params: SecurityParams) => void
  onDelete: () => void
  errors: Record<string, string>
}

interface RentalCardProps {
  id: string
  type: 'rental-property'
  params: RentalPropertyParams
  onChange: (params: RentalPropertyParams) => void
  onDelete: () => void
  errors: Record<string, string>
}

type InvestmentCardProps = SecurityCardProps | RentalCardProps

export function InvestmentCard(props: InvestmentCardProps) {
  const { type, params, onDelete, errors } = props
  const [collapsed, setCollapsed] = useState(false)

  const typeLabel = type === 'security' ? 'Security' : 'Rental Property'
  const displayName = params.name || `Untitled ${typeLabel}`

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-t-lg">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-sm font-medium text-gray-800 hover:text-gray-600 cursor-pointer"
        >
          <span className="text-xs">{collapsed ? '▸' : '▾'}</span>
          <span>{displayName}</span>
          <span className="text-xs text-gray-400 font-normal">{typeLabel}</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-gray-400 hover:text-red-500 text-sm cursor-pointer"
          title="Delete investment"
        >
          ✕
        </button>
      </div>

      {/* Duplicate name warning */}
      {errors._duplicateName && (
        <div className="px-4 py-2 bg-yellow-50 text-yellow-700 text-xs border-b border-yellow-100">
          {errors._duplicateName}
        </div>
      )}

      {/* Body */}
      {!collapsed && (
        <div className="px-4 py-4">
          {type === 'security' ? (
            <SecurityForm
              params={props.params as SecurityParams}
              onChange={props.onChange as (params: SecurityParams) => void}
              errors={errors}
            />
          ) : (
            <RentalPropertyForm
              params={props.params as RentalPropertyParams}
              onChange={props.onChange as (params: RentalPropertyParams) => void}
              errors={errors}
            />
          )}
        </div>
      )}
    </div>
  )
}
