import type { ReactNode } from "react";
import type { AnalysisResult as RulesAnalysis, Severity } from "@/lib/statute/ma";

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

// These cards are the visitor's leverage, so they carry the brand green of
// "money coming back," not warning colors that read as bad news for them.
const severityStyles: Record<Severity, string> = {
  high: "border-l-4 border-accent bg-accent/5",
  medium: "border-l-4 border-accent-light bg-accent/5",
  low: "border-l-4 border-gray-300 bg-gray-50",
  info: "border-l-4 border-gray-200 bg-gray-50",
};

const severityBadges: Record<Severity, string | null> = {
  high: "Strong claim",
  medium: "Supporting claim",
  low: null,
  info: null,
};

function ExposureBreakdown({ exposure }: { exposure: RulesAnalysis["exposure"] }) {
  const { outstandingBalance, trebleApplies, trebledPrincipal, interestOwed, maxExposure } =
    exposure;

  if (maxExposure <= 0) return null;

  const lines: { label: string; amount: number; citation?: string }[] = [];

  if (trebleApplies) {
    lines.push({
      label: "Deposit balance owed",
      amount: outstandingBalance,
    });
    lines.push({
      label: "x3 treble damages",
      amount: trebledPrincipal - outstandingBalance,
      citation: "M.G.L. c. 186, §15B(7)",
    });
  } else if (outstandingBalance > 0) {
    lines.push({
      label: "Deposit balance owed",
      amount: outstandingBalance,
    });
  }

  if (interestOwed > 0) {
    lines.push({
      label: "Unpaid annual interest (5%/yr)",
      amount: interestOwed,
      citation: "M.G.L. c. 186, §15B(3)(b)",
    });
  }

  return (
    <div className="mt-5 rounded-xl bg-white/10 px-4 py-4 text-left">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/70">
        How this number is calculated
      </p>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <div key={i} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-white/90">
              {i > 0 && <span className="mr-1.5 text-white/50">+</span>}
              {line.label}
              {line.citation && (
                <span className="ml-1.5 text-xs text-white/50">({line.citation})</span>
              )}
            </span>
            <span className="whitespace-nowrap font-medium text-white">
              {formatCurrency(line.amount)}
            </span>
          </div>
        ))}
        <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-white/20 pt-2 text-sm">
          <span className="font-semibold text-white">Total potential claim</span>
          <span className="whitespace-nowrap font-semibold text-white">
            {formatCurrency(maxExposure)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * `cta` renders directly under the violation cards, which is the moment a
 * reader has both the number and the reasons for it. Previously the only call
 * to action sat below the deduction flags AND a full disclaimer paragraph,
 * several screens down on the mobile traffic this page mostly serves.
 */
export function AnalysisResult({
  analysis,
  cta,
}: {
  analysis: RulesAnalysis;
  cta?: ReactNode;
}) {
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
        <ExposureBreakdown exposure={analysis.exposure} />
      </div>

      {triggeredRules.length > 0 ? (
        <div className="mb-8 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">
            What your landlord may have gotten wrong
          </h3>
          {triggeredRules.map((rule) => (
            <div key={rule.id} className={`rounded-lg p-4 ${severityStyles[rule.severity]}`}>
              {severityBadges[rule.severity] && (
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
                  {severityBadges[rule.severity]}
                </p>
              )}
              <p className="font-medium text-gray-900">{rule.title}</p>
              <p className="mt-1 text-sm text-gray-700">{rule.explanation}</p>
              <p className="mt-2 text-sm text-gray-800">
                <span className="font-medium">{rule.plainTerms.split(":")[0]}:</span>
                {rule.plainTerms.substring(rule.plainTerms.indexOf(":") + 1)}
              </p>
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

      {cta}

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

    </div>
  );
}
