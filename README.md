# ROI Visualizer

A frontend-only tool that lets users compare long-term outcomes of different investment types (stocks/funds vs. rental properties) through interactive charts. Educational and exploratory, not financial advice.

## Getting Started

```bash
npm install        # Install dependencies
npm run dev        # Dev server with HMR
```

## Commands

```bash
npm run build      # Production build (type-check + bundle)
npx vitest run     # Run all tests
npx vitest run src/models/security.test.ts   # Single test file
npx vitest         # Tests in watch mode
```

## Tech Stack

- **React + TypeScript** with **Vite**
- **Tailwind CSS** for styling
- **Recharts** for charting
- **Vitest** for unit tests

## Features

- **Security assets**: Stocks, index funds, ETFs with compound growth, expense ratios, dividends
- **Rental properties**: Mortgage amortization, appreciation, cash flow, vacancy, selling costs
- **Interactive chart**: Multi-line comparison, draggable legend with toggle, time horizon slider
- **Asset type selector**: Add securities or rental properties via dropdown
- **Auto-naming & validation**: Sequential naming, duplicate warnings, model + UI-layer validation
