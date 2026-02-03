# CLAUDE.md

ROI Visualizer — frontend-only tool comparing long-term outcomes of stocks/funds, rental properties, precious metals, and fixed-income instruments via interactive charts. See `project-description.txt` for full blueprint.

## Stack

React + TypeScript, Vite, Tailwind CSS, Recharts, Vitest

## Structure

```
src/
  models/   types.ts | security.ts | rental.ts | precious-metal.ts | fixed-income.ts | validation.ts | *.test.ts
  components/   LandingPage | InvestmentCard | SecurityForm | RentalPropertyForm
                PreciousMetalForm | FixedIncomeForm | FormComponents | InvestmentChart
  hooks/    useDebounce.ts
  App.tsx
```

## Rules (do not violate)

- **Strict interface**: all assets implement `InvestmentAsset` with `computeValueOverTime(years): number[]`. Chart only consumes `number[]`.
- **Deterministic models**: pure functions, no randomness. Models have zero React dependencies.
- **Validation split**: model layer = numeric bounds; UI layer = required-field checks.
- **Chart updates**: debounced (300ms), never on every keystroke.
- **Rental MVP assumptions** (documented in `rental.ts`): annualized mortgage payments, constant rental income, no refinancing/taxes/deductions.
- **Precious metal MVP assumptions** (documented in `precious-metal.ts`): constant annual price increase, no storage/insurance costs, transaction fee on selling only.
- **Fixed income MVP assumptions** (documented in `fixed-income.ts`): constant yield (no rate changes at reinvestment), no early withdrawal penalties, no taxes or fees.

## Current Focus

See `TODO.md` for active phase and task status.
