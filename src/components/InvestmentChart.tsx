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

const COMBINED_COLOR = '#374151' // dark gray
const COMBINED_NAME = 'Combined Portfolio'

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

function deflate(value: number, year: number, rate: number): number {
  return year === 0 ? value : value / Math.pow(1 + rate, year)
}

function getPointerPosition(e: MouseEvent | TouchEvent): { clientX: number; clientY: number } {
  if ('touches' in e) {
    const touch = e.touches[0] || e.changedTouches[0]
    return { clientX: touch.clientX, clientY: touch.clientY }
  }
  return { clientX: e.clientX, clientY: e.clientY }
}

export function InvestmentChart({ series, years }: InvestmentChartProps) {
  const [displayYears, setDisplayYears] = useState(years)
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set())
  const [chartMode, setChartMode] = useState<ChartMode>('total-value')
  const [showCombined, setShowCombined] = useState(false)
  const [legendPos, setLegendPos] = useState({ x: 95, y: 8 })
  const [inflationEnabled, setInflationEnabled] = useState(false)
  const [inflationRate, setInflationRate] = useState(0.025)
  const [userHasDragged, setUserHasDragged] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  // Sync slider to max years when investments change
  useEffect(() => {
    setDisplayYears(years)
  }, [years])

  // --- Unified pointer handlers for mouse + touch ---
  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragRef.current || !chartContainerRef.current) return
    const pos = getPointerPosition(e)
    const rect = chartContainerRef.current.getBoundingClientRect()
    const x = dragRef.current.originX + (pos.clientX - dragRef.current.startX)
    const y = dragRef.current.originY + (pos.clientY - dragRef.current.startY)
    const clampedX = Math.max(0, Math.min(x, rect.width - 40))
    const clampedY = Math.max(0, Math.min(y, rect.height - 30))
    setLegendPos({ x: clampedX, y: clampedY })
  }, [])

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
    document.removeEventListener('mousemove', handlePointerMove)
    document.removeEventListener('mouseup', handlePointerUp)
    document.removeEventListener('touchmove', handlePointerMove as EventListener)
    document.removeEventListener('touchend', handlePointerUp)
  }, [handlePointerMove])

  function handlePointerDown(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    setUserHasDragged(true)
    const pos = 'touches' in e.nativeEvent
      ? { clientX: e.nativeEvent.touches[0].clientX, clientY: e.nativeEvent.touches[0].clientY }
      : { clientX: (e as React.MouseEvent).clientX, clientY: (e as React.MouseEvent).clientY }
    dragRef.current = {
      startX: pos.clientX,
      startY: pos.clientY,
      originX: legendPos.x,
      originY: legendPos.y,
    }
    document.addEventListener('mousemove', handlePointerMove)
    document.addEventListener('mouseup', handlePointerUp)
    document.addEventListener('touchmove', handlePointerMove as EventListener, { passive: false })
    document.addEventListener('touchend', handlePointerUp)
  }

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handlePointerMove)
      document.removeEventListener('mouseup', handlePointerUp)
      document.removeEventListener('touchmove', handlePointerMove as EventListener)
      document.removeEventListener('touchend', handlePointerUp)
    }
  }, [handlePointerMove, handlePointerUp])

  // Auto-position legend when chart context changes (merged with userHasDragged
  // reset to avoid stale-state timing issues between separate effects)
  const prevContextRef = useRef<string>('')
  useEffect(() => {
    // Detect whether the chart context changed (mode, data, inflation)
    const contextKey = `${chartMode}|${series.map(s => s.name).join(',')}|${inflationEnabled}|${inflationRate}`
    if (prevContextRef.current !== contextKey) {
      prevContextRef.current = contextKey
      setUserHasDragged(false)
      // fall through to reposition
    } else if (userHasDragged) {
      return
    }

    if (!chartContainerRef.current) return
    const rect = chartContainerRef.current.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const visibleSeries = series.filter(s => !hiddenSeries.has(s.name))
    const effectiveYrs = Math.min(displayYears, years)
    if (visibleSeries.length === 0 || effectiveYrs <= 0) {
      setLegendPos({ x: 100, y: 10 })
      return
    }

    // Recharts plot area bounds (must match LineChart margin + YAxis width)
    const YAXIS_W = 70
    const MARGIN = { top: 5, right: 30, left: 20, bottom: 5 }
    const XAXIS_H = 25 // approximate x-axis label + "Year" label height
    const plotLeft = MARGIN.left + YAXIS_W
    const plotTop = MARGIN.top
    const plotRight = rect.width - MARGIN.right
    const plotBottom = rect.height - MARGIN.bottom - XAXIS_H
    const plotWidth = plotRight - plotLeft
    const plotHeight = plotBottom - plotTop

    const PAD = 8
    const LEGEND_W = 150
    const LEGEND_H = series.length * 22 + 16

    // Candidate positions within the plot area only (avoids axes)
    const candidates = [
      { x: plotLeft + PAD, y: plotTop + PAD },                                       // top-left of plot
      { x: plotRight - LEGEND_W - PAD, y: plotTop + PAD },                           // top-right of plot
      { x: plotLeft + PAD, y: plotBottom - LEGEND_H - PAD },                         // bottom-left of plot
      { x: plotRight - LEGEND_W - PAD, y: plotBottom - LEGEND_H - PAD },             // bottom-right of plot
      { x: plotLeft + (plotWidth - LEGEND_W) / 2, y: plotTop + PAD },                // top-center
      { x: plotLeft + (plotWidth - LEGEND_W) / 2, y: plotBottom - LEGEND_H - PAD },  // bottom-center
    ]

    // Compute display values matching what the chart actually renders
    // (annualized % or inflation-adjusted $), then map to pixel-y for scoring
    const isAnnualized = chartMode === 'annualized-return'
    const MAX_RATE = 500
    const startY = isAnnualized ? 1 : 0

    function getDisplayValue(s: { values: number[]; initialInvestment: number }, y: number): number | null {
      if (y >= s.values.length) return null
      const adj = inflationEnabled ? deflate(s.values[y], y, inflationRate) : s.values[y]
      if (!isAnnualized) return adj
      // Annualized return calculation (mirrors the data-building loop)
      if (s.initialInvestment <= 0) {
        const adjBase = inflationEnabled ? deflate(s.values[0], 0, inflationRate) : s.values[0]
        return adj > adjBase ? MAX_RATE : -MAX_RATE
      }
      const ratio = adj / s.initialInvestment
      if (ratio <= 0) return -100
      const rate = (Math.pow(ratio, 1 / y) - 1) * 100
      return Math.max(-100, Math.min(rate, MAX_RATE))
    }

    const allVals: number[] = []
    for (const s of visibleSeries) {
      for (let y = startY; y <= effectiveYrs && y < s.values.length; y++) {
        const v = getDisplayValue(s, y)
        if (v != null) allVals.push(v)
      }
    }
    if (allVals.length === 0) {
      setLegendPos(candidates[0])
      return
    }
    const maxVal = Math.max(...allVals)
    const minVal = Math.min(...allVals)
    const valRange = maxVal - minVal || 1

    // Score each candidate by counting how many curve data points
    // fall inside the legend bounding box in pixel space
    const scores = candidates.map(pos => {
      const lLeft = pos.x
      const lRight = pos.x + LEGEND_W
      const lTop = pos.y
      const lBottom = pos.y + LEGEND_H

      // Which years does the legend cover?
      const yStart = Math.max(startY, Math.floor(((lLeft - plotLeft) / plotWidth) * effectiveYrs))
      const yEnd = Math.min(effectiveYrs, Math.ceil(((lRight - plotLeft) / plotWidth) * effectiveYrs))

      let overlap = 0
      for (const s of visibleSeries) {
        for (let y = yStart; y <= yEnd && y < s.values.length; y++) {
          const val = getDisplayValue(s, y)
          if (val == null) continue
          // Map value to pixel-y (inverted: high values = low pixel-y)
          const pixelY = plotTop + (1 - (val - minVal) / valRange) * plotHeight
          if (pixelY >= lTop - 10 && pixelY <= lBottom + 10) {
            overlap++
          }
        }
      }
      return overlap
    })

    let bestIdx = 0
    let bestScore = scores[0]
    for (let i = 1; i < scores.length; i++) {
      if (scores[i] < bestScore) {
        bestScore = scores[i]
        bestIdx = i
      }
    }
    setLegendPos(candidates[bestIdx])
  }, [chartMode, series, displayYears, years, hiddenSeries, userHasDragged, inflationEnabled, inflationRate])

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
  const MAX_ANNUALIZED_RATE = 500

  const combinedInitialInvestment = series.reduce((sum, s) => sum + s.initialInvestment, 0)

  function getCombinedValueAtYear(y: number): number {
    let total = 0
    for (const s of series) {
      if (y < s.values.length) {
        total += s.values[y]
      } else if (s.values.length > 0) {
        total += s.values[s.values.length - 1]
      }
    }
    return total
  }

  const adjust = (value: number, year: number): number =>
    inflationEnabled ? deflate(value, year, inflationRate) : value

  // Build chart data
  const data = []
  const startYear = isAnnualized ? 1 : 0
  for (let y = startYear; y <= effectiveYears; y++) {
    const point: Record<string, number> = { year: y }
    for (const s of series) {
      if (y < s.values.length) {
        if (isAnnualized) {
          if (s.initialInvestment <= 0) {
            const adjCurrent = adjust(s.values[y], y)
            const adjBase = adjust(s.values[0], 0)
            point[s.name] = adjCurrent > adjBase ? MAX_ANNUALIZED_RATE : -MAX_ANNUALIZED_RATE
          } else {
            const adjValue = adjust(s.values[y], y)
            const ratio = adjValue / s.initialInvestment
            let annualizedRate: number
            if (ratio <= 0) {
              annualizedRate = -100
            } else {
              annualizedRate = (Math.pow(ratio, 1 / y) - 1) * 100
            }
            point[s.name] = Math.max(-100, Math.min(annualizedRate, MAX_ANNUALIZED_RATE))
          }
        } else {
          point[s.name] = Math.round(adjust(s.values[y], y) * 100) / 100
        }
      }
    }

    // Combined portfolio data point
    if (showCombined && series.length > 0) {
      const combinedRaw = getCombinedValueAtYear(y)
      const combinedValue = adjust(combinedRaw, y)
      if (isAnnualized) {
        if (combinedInitialInvestment <= 0) {
          const adjBase = adjust(getCombinedValueAtYear(0), 0)
          point[COMBINED_NAME] = combinedValue > adjBase ? MAX_ANNUALIZED_RATE : -MAX_ANNUALIZED_RATE
        } else {
          const ratio = combinedValue / combinedInitialInvestment
          let annualizedRate: number
          if (ratio <= 0) {
            annualizedRate = -100
          } else {
            annualizedRate = (Math.pow(ratio, 1 / y) - 1) * 100
          }
          point[COMBINED_NAME] = Math.max(-100, Math.min(annualizedRate, MAX_ANNUALIZED_RATE))
        }
      } else {
        point[COMBINED_NAME] = Math.round(combinedValue * 100) / 100
      }
    }

    data.push(point)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-medium text-gray-700">
            {isAnnualized
              ? `Annualized Rate of Return${inflationEnabled ? ' (Real)' : ''}`
              : `Investment Value Over Time${inflationEnabled ? " (Today's Dollars)" : ''}`}
          </h3>
          {series.length > 1 && (
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showCombined}
                onChange={e => setShowCombined(e.target.checked)}
                className="rounded border-gray-300 text-gray-700 focus:ring-gray-500"
              />
              Combined
            </label>
          )}
        </div>
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

      {/* Inflation adjustment controls */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={inflationEnabled}
            onChange={e => setInflationEnabled(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Show values in today&apos;s dollars
        </label>
        {inflationEnabled && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">
              Inflation:
            </label>
            <input
              type="range"
              min={0}
              max={10}
              step={0.1}
              value={inflationRate * 100}
              onChange={e => setInflationRate(parseFloat(e.target.value) / 100)}
              className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-xs text-gray-600 w-10 text-right">
              {(inflationRate * 100).toFixed(1)}%
            </span>
          </div>
        )}
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
              labelFormatter={(label) => `Year ${label}${inflationEnabled ? ' (inflation-adjusted)' : ''}`}
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
            {showCombined && series.length > 1 && (
              <Line
                key={COMBINED_NAME}
                type="monotone"
                dataKey={COMBINED_NAME}
                stroke={COMBINED_COLOR}
                strokeWidth={3}
                strokeDasharray="6 3"
                dot={false}
                activeDot={{ r: 4 }}
                hide={hiddenSeries.has(COMBINED_NAME)}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Draggable legend (mouse + touch) */}
        <div
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          style={{ left: legendPos.x, top: legendPos.y, touchAction: 'none' }}
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
          {showCombined && series.length > 1 && (
            <button
              type="button"
              onClick={() => toggleSeries(COMBINED_NAME)}
              className="flex items-center gap-1.5 text-xs py-0.5 cursor-pointer border-t border-gray-200 mt-0.5 pt-1"
              style={{ opacity: hiddenSeries.has(COMBINED_NAME) ? 0.4 : 1 }}
            >
              <span
                className="inline-block w-3 rounded"
                style={{ backgroundColor: COMBINED_COLOR, height: '2px', borderTop: `1px dashed ${COMBINED_COLOR}` }}
              />
              <span className="text-gray-700 font-medium">{COMBINED_NAME}</span>
            </button>
          )}
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
