import { useState, useMemo, useRef, useEffect } from 'react'
import { LandingPage } from './components/LandingPage'
import { InvestmentCard } from './components/InvestmentCard'
import { InvestmentChart } from './components/InvestmentChart'
import { computeSecurityValues } from './models/security'
import { computeRentalValues } from './models/rental'
import { validateSecurityParams, validateRentalParams } from './models/validation'
import { useDebounce } from './hooks/useDebounce'
import type { SecurityParams, RentalPropertyParams } from './models/types'
import { DEFAULT_SECURITY_PARAMS, DEFAULT_RENTAL_PARAMS } from './models/types'

interface SecurityEntry {
  id: string
  type: 'security'
  params: SecurityParams
}

interface RentalEntry {
  id: string
  type: 'rental-property'
  params: RentalPropertyParams
}

type InvestmentEntry = SecurityEntry | RentalEntry

type AssetType = 'security' | 'rental-property'

let nextId = 1

function generateId(): string {
  return `inv-${nextId++}`
}

function App() {
  const [investments, setInvestments] = useState<InvestmentEntry[]>([])
  const [securityCount, setSecurityCount] = useState(0)
  const [rentalCount, setRentalCount] = useState(0)
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowTypeMenu(false)
      }
    }
    if (showTypeMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTypeMenu])

  // Debounce the entire investments array so chart doesn't re-render on every keystroke
  const debouncedInvestments = useDebounce(investments, 300)

  function addInvestment(type: AssetType) {
    const id = generateId()
    if (type === 'security') {
      const count = securityCount + 1
      setSecurityCount(count)
      setInvestments(prev => [
        ...prev,
        {
          id,
          type: 'security',
          params: {
            ...DEFAULT_SECURITY_PARAMS,
            name: `Security #${count}`,
          },
        },
      ])
    } else {
      const count = rentalCount + 1
      setRentalCount(count)
      setInvestments(prev => [
        ...prev,
        {
          id,
          type: 'rental-property',
          params: {
            ...DEFAULT_RENTAL_PARAMS,
            name: `Rental Property #${count}`,
          },
        },
      ])
    }
    setShowTypeMenu(false)
  }

  function updateInvestment(id: string, params: SecurityParams | RentalPropertyParams) {
    setInvestments(prev =>
      prev.map(inv => (inv.id === id ? { ...inv, params } as InvestmentEntry : inv))
    )
  }

  function deleteInvestment(id: string) {
    setInvestments(prev => prev.filter(inv => inv.id !== id))
  }

  // Compute chart series from debounced investments
  const chartData = useMemo(() => {
    const validInvestments = debouncedInvestments.filter(inv => {
      if (inv.type === 'security') {
        return validateSecurityParams(inv.params).length === 0
      } else {
        return validateRentalParams(inv.params).length === 0
      }
    })

    const maxYears = Math.max(
      ...validInvestments.map(inv => inv.params.timeHorizon),
      0
    )

    const series = validInvestments.map(inv => {
      const values = inv.type === 'security'
        ? computeSecurityValues(inv.params, inv.params.timeHorizon)
        : computeRentalValues(inv.params, inv.params.timeHorizon)
      return {
        name: inv.params.name || 'Untitled',
        values,
      }
    })

    return { series, years: maxYears }
  }, [debouncedInvestments])

  // UI-layer validation: required-field checks
  function getUiErrors(inv: InvestmentEntry): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!inv.params.name.trim()) {
      errors.name = 'Name is required'
    }
    if (!inv.params.timeHorizon) {
      errors.timeHorizon = 'Time horizon is required'
    }
    if (inv.type === 'security') {
      if (!inv.params.initialInvestment && inv.params.initialInvestment !== 0) {
        errors.initialInvestment = 'Initial investment is required'
      }
    } else {
      if (!inv.params.purchasePrice && inv.params.purchasePrice !== 0) {
        errors.purchasePrice = 'Purchase price is required'
      }
    }
    return errors
  }

  // Check for duplicate names
  function getDuplicateWarning(id: string, name: string): string | undefined {
    const trimmed = name.trim().toLowerCase()
    if (!trimmed) return undefined
    const hasDuplicate = investments.some(
      inv => inv.id !== id && inv.params.name.trim().toLowerCase() === trimmed
    )
    return hasDuplicate ? 'Another investment has the same name' : undefined
  }

  const hasInvestments = investments.length > 0

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {!hasInvestments ? (
          <LandingPage onAddInvestment={() => setShowTypeMenu(true)} />
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                ROI Visualizer
              </h1>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowTypeMenu(!showTypeMenu)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  + Add Investment
                </button>
                {showTypeMenu && (
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => addInvestment('security')}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-t-lg cursor-pointer"
                    >
                      <div className="font-medium text-gray-800">Security (Stock / Fund)</div>
                      <div className="text-xs text-gray-500">Stocks, index funds, ETFs</div>
                    </button>
                    <button
                      onClick={() => addInvestment('rental-property')}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-b-lg border-t border-gray-100 cursor-pointer"
                    >
                      <div className="font-medium text-gray-800">Rental Property</div>
                      <div className="text-xs text-gray-500">Residential rental real estate</div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Chart */}
            <InvestmentChart
              series={chartData.series}
              years={chartData.years}
            />

            {/* Investment Cards */}
            <div className="space-y-4">
              {investments.map(inv => {
                const uiErrors = getUiErrors(inv)
                const dupWarning = getDuplicateWarning(inv.id, inv.params.name)
                if (dupWarning) {
                  uiErrors._duplicateName = dupWarning
                }
                if (inv.type === 'security') {
                  return (
                    <InvestmentCard
                      key={inv.id}
                      id={inv.id}
                      type="security"
                      params={inv.params}
                      onChange={params => updateInvestment(inv.id, params)}
                      onDelete={() => deleteInvestment(inv.id)}
                      errors={uiErrors}
                    />
                  )
                } else {
                  return (
                    <InvestmentCard
                      key={inv.id}
                      id={inv.id}
                      type="rental-property"
                      params={inv.params}
                      onChange={params => updateInvestment(inv.id, params)}
                      onDelete={() => deleteInvestment(inv.id)}
                      errors={uiErrors}
                    />
                  )
                }
              })}
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-400 text-center">
              This is an educational tool, not financial advice. All models use
              simplified, deterministic assumptions.
            </p>
          </div>
        )}

        {/* Type selector for landing page */}
        {!hasInvestments && showTypeMenu && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-20" onClick={() => setShowTypeMenu(false)}>
            <div className="bg-white rounded-lg shadow-xl w-80 p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Investment Type</h3>
              <div className="space-y-2">
                <button
                  onClick={() => addInvestment('security')}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                >
                  <div className="font-medium text-gray-800">Security (Stock / Fund)</div>
                  <div className="text-xs text-gray-500">Stocks, index funds, ETFs</div>
                </button>
                <button
                  onClick={() => addInvestment('rental-property')}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                >
                  <div className="font-medium text-gray-800">Rental Property</div>
                  <div className="text-xs text-gray-500">Residential rental real estate</div>
                </button>
              </div>
              <button
                onClick={() => setShowTypeMenu(false)}
                className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
