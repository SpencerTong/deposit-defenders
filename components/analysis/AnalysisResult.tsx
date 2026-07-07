import type { AnalysisResult as RulesAnalysis, Severity } from "@/lib/statute/ma";

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

const severityStyles: Record<Severity, string> = {
  high: "border-l-4 border-red-500 bg-red-50",
  medium: "border-l-4 border-amber-500 bg-amber-50",
  low: "border-l-4 border-gray-300 bg-gray-50",
  info: "border-l-4 border-gray-200 bg-gray-50",
};

export function AnalysisResult({ analysis }: { analysis: RulesAnalysis }) {
  const triggeredRules = analysis.rules.filter(
    (rule) => rule.triggered && rule.id !== "R5_WEAR_AND_TEAR_FLAGS"
  );
  const contestableFlags = analysis.deductionFlags.filter(
    (flag) => flag.classification === "commonly_contestable"
  );

  return (
    <div>
      <div className="mb-8 rounded-2xl bg-accent px-6 py-8 text-center text-white shadow-lg">
        <p className="mb-2 text-sm uppercase tracking-wide text-white/70">Your potential claim</p>
        <p className="text-4xl font-bold sm:text-5xl">
          up to {formatCurrency(analysis.exposure.maxExposure)}
        </p>
        {analysis.exposure.trebleApplies && (
          <p className="mt-3 text-sm text-white/80">
            This can include treble (3x) damages under Massachusetts law.
          </p>
        )}
      </div>

      {triggeredRules.length > 0 ? (
        <div className="mb-8 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">
            What your landlord may have gotten wrong
          </h3>
          {triggeredRules.map((rule) => (
            <div key={rule.id} className={`rounded-lg p-4 ${severityStyles[rule.severity]}`}>
              <p className="font-medium text-gray-900">{rule.title}</p>
              <p className="mt-1 text-sm text-gray-700">{rule.explanation}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                {rule.citation}
              </p>
            </div>
          ))}
          {analysis.exposure.notes.map((note, i) => (
            <p key={i} className="text-sm text-gray-500">
              {note}
            </p>
          ))}
        </div>
      ) : (
        <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-700">
          Based on your answers, we didn&apos;t find a clear violation of the Massachusetts
          security deposit law. You may still want to review your paperwork carefully.
        </div>
      )}

      {contestableFlags.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-1 text-lg font-semibold text-gray-900">
            Deductions worth a closer look
          </h3>
          <p className="mb-3 text-sm text-gray-500">
            Informational flags only, not a legal conclusion about any specific deduction.
          </p>
          <ul className="space-y-2">
            {contestableFlags.map((flag, i) => (
              <li key={i} className="rounded-lg border border-gray-200 p-3 text-sm">
                <span className="font-medium text-gray-900">{flag.description}</span>{" "}
                <span className="text-gray-500">({formatCurrency(flag.amount)})</span>
                <p className="mt-1 text-gray-600">{flag.note}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm text-gray-500">
        This tool provides general legal information, not legal advice, and does not create an
        attorney-client relationship. For advice about your situation, consult a licensed
        Massachusetts attorney.
      </p>
    </div>
  );
}
