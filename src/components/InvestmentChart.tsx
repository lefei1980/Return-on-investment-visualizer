import { useState, useEffect, useRef, useCallback } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const COLORS = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#9333ea', // purple
  '#ea580c', // orange
  '#0891b2', // cyan
]

interface ChartSeries {
  name: string
  values: number[]
  initialInvestment: number
}

type ChartMode = 'total-value' | 'annualized-return'

interface InvestmentChartProps {
  series: ChartSeries[]
  years: number
}

function formatDollar(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function formatPercent(value: number): string {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K%`
  return `${value.toFixed(1)}%`
}

export function InvestmentChart({ series, years }: InvestmentChartProps) {
  const [displayYears, setDisplayYears] = useState(years)
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set())
  const [chartMode, setChartMode] = useState<ChartMode>('total-value')
  const [legendPos, setLegendPos] = useState({ x: 95, y: 8 })
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  // Sync slider to max years when investments change
  useEffect(() => {
    setDisplayYears(years)
  }, [years])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current || !chartContainerRef.current) return
    const rect = chartContainerRef.current.getBoundingClientRect()
    const x = dragRef.current.originX + (e.clientX - dragRef.current.startX)
    const y = dragRef.current.originY + (e.clientY - dragRef.current.startY)
    // Clamp within the chart container
    const clampedX = Math.max(0, Math.min(x, rect.width - 40))
    const clampedY = Math.max(0, Math.min(y, rect.height - 30))
    setLegendPos({ x: clampedX, y: clampedY })
  }, [])

  const handleMouseUp = useCallback(() => {
    dragRef.current = null
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  function handleLegendMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: legendPos.x,
      originY: legendPos.y,
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  function toggleSeries(name: string) {
    setHiddenSeries(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  if (series.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-400 text-sm">
          Add an investment to see the chart
        </p>
      </div>
    )
  }

  const effectiveYears = Math.min(displayYears, years)
  const isAnnualized = chartMode === 'annualized-return'
  const MAX_ANNUALIZED_RATE = 500 // Cap at 500% for display

  // Build chart data: [{year: 0, "Series A": 10000, "Series B": 5000}, ...]
  const data = []
  const startYear = isAnnualized ? 1 : 0 // Year 0 is undefined for annualized rate
  for (let y = startYear; y <= effectiveYears; y++) {
    const point: Record<string, number> = { year: y }
    for (const s of series) {
      if (y < s.values.length) {
        if (isAnnualized) {
          if (s.initialInvestment <= 0) {
            // Infinite leverage (e.g. zero down payment): clip to max
            point[s.name] = s.values[y] > s.values[0] ? MAX_ANNUALIZED_RATE : -MAX_ANNUALIZED_RATE
          } else {
            const ratio = s.values[y] / s.initialInvestment
            let annualizedRate: number
            if (ratio <= 0) {
              annualizedRate = -100 // Total loss
            } else {
              annualizedRate = (Math.pow(ratio, 1 / y) - 1) * 100
            }
            point[s.name] = Math.max(-100, Math.min(annualizedRate, MAX_ANNUALIZED_RATE))
          }
        } else {
          point[s.name] = Math.round(s.values[y] * 100) / 100
        }
      }
    }
    data.push(point)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">
          {isAnnualized ? 'Annualized Rate of Return' : 'Investment Value Over Time'}
        </h3>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setChartMode('total-value')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              chartMode === 'total-value'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Total Value
          </button>
          <button
            type="button"
            onClick={() => setChartMode('annualized-return')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              chartMode === 'annualized-return'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Annualized Return
          </button>
        </div>
      </div>
      <div className="relative" ref={chartContainerRef}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={isAnnualized ? formatPercent : formatDollar}
              tick={{ fontSize: 12 }}
              width={70}
            />
            <Tooltip
              formatter={(value: number | undefined) => {
                if (value == null) return ''
                if (isAnnualized) {
                  return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
                }
                return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              }}
              labelFormatter={(label) => `Year ${label}`}
            />
            {series.map((s, i) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                hide={hiddenSeries.has(s.name)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Draggable legend */}
        <div
          onMouseDown={handleLegendMouseDown}
          style={{ left: legendPos.x, top: legendPos.y }}
          className="absolute bg-white/90 border border-gray-200 rounded px-2 py-1.5 shadow-sm cursor-grab active:cursor-grabbing select-none"
        >
          {series.map((s, i) => (
            <button
              key={s.name}
              type="button"
              onClick={() => toggleSeries(s.name)}
              className="flex items-center gap-1.5 text-xs py-0.5 cursor-pointer"
              style={{ opacity: hiddenSeries.has(s.name) ? 0.4 : 1 }}
            >
              <span
                className="inline-block w-3 h-0.5 rounded"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-gray-700">{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Time horizon slider */}
      {years > 1 && (
        <div className="mt-4 flex items-center gap-3">
          <label className="text-xs text-gray-500 whitespace-nowrap">
            Display range:
          </label>
          <input
            type="range"
            min={1}
            max={years}
            value={effectiveYears}
            onChange={e => setDisplayYears(parseInt(e.target.value))}
            className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span className="text-xs text-gray-600 w-16 text-right">
            {effectiveYears} {effectiveYears === 1 ? 'year' : 'years'}
          </span>
        </div>
      )}
    </div>
  )
}
