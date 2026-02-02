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
        and rental properties — through interactive charts. See how compounding,
        costs, and leverage shape returns over decades.
      </p>
      <p className="text-sm text-gray-400 mb-8">
        This is an educational tool, not financial advice. All models use
        simplified, deterministic assumptions.
      </p>
      <button
        onClick={onAddInvestment}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer"
      >
        + Add an Investment
      </button>
    </div>
  )
}
