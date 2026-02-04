interface LandingPageProps {
  onAddInvestment: () => void
}

export function LandingPage({ onAddInvestment }: LandingPageProps) {
  return (
    <div className="text-center py-16 px-4 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        ROI Visualizer
      </h1>
      <p className="text-lg text-gray-600 mb-6">
        Compare long-term outcomes of different investment types — stocks, funds,
        rental properties, precious metals, and fixed-income instruments like
        treasury bills, notes, and CDs — through interactive charts. See how
        compounding, costs, and leverage shape returns over decades.
      </p>
      <p className="text-sm text-gray-400 mb-2">
        This is an educational tool, not financial advice. All models use
        simplified, deterministic assumptions.
      </p>
      <p className="text-sm text-gray-400 mb-2">
        Your data stays in your browser. This tool runs entirely client-side
        with no backend, no database, and no data collection &mdash; nothing you
        enter is stored or transmitted.
      </p>
      <p className="text-sm text-gray-500 mb-8">
        Designed and developed by Fei Le
      </p>
      <button
        onClick={onAddInvestment}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer"
      >
        + Add an Investment
      </button>
      <p className="mt-12 text-xs text-gray-400">
        &copy; 2026 Fei Le. All rights reserved.
      </p>
    </div>
  )
}
