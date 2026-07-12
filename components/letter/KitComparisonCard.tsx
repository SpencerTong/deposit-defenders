"use client";

import Link from "next/link";

interface ComparisonRow {
  label: string;
  free: boolean;
}

const ROWS: ComparisonRow[] = [
  { label: "Violation analysis under M.G.L. c. 186 §15B", free: true },
  { label: "What you may be owed, in dollars", free: true },
  { label: "Formal demand letter citing your exact violations", free: false },
  { label: "Sent to your landlord by certified mail, for you", free: false },
  { label: "Small claims filing plan with your numbers filled in", free: false },
  { label: "Evidence checklist and deadline tracker", free: false },
];

function Mark({ included }: { included: boolean }) {
  return included ? (
    <span aria-label="Included" className="font-semibold text-accent">
      &#10003;
    </span>
  ) : (
    <span aria-label="Not included" className="text-gray-300">
      &ndash;
    </span>
  );
}

export function KitComparisonCard({ onCtaClick }: { onCtaClick: () => void }) {
  return (
    <div className="mt-10 overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="grid grid-cols-[1fr_4rem_5rem] items-center gap-x-2 border-b border-gray-200 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-900">
        <span>What you get</span>
        <span className="text-center">Free</span>
        <span className="text-center text-accent">$49 Kit</span>
      </div>
      <ul>
        {ROWS.map((row) => (
          <li
            key={row.label}
            className="grid grid-cols-[1fr_4rem_5rem] items-center gap-x-2 border-b border-gray-100 px-5 py-3 text-sm text-gray-700"
          >
            <span>{row.label}</span>
            <span className="text-center">
              <Mark included={row.free} />
            </span>
            <span className="text-center">
              <Mark included />
            </span>
          </li>
        ))}
      </ul>
      <div className="p-5">
        <p className="mb-4 text-sm text-gray-600">
          You have the analysis. The kit turns it into action: we write your formal demand
          letter citing each violation above, send it to your landlord by certified mail for
          you, and hand you the complete plan for small claims court if they still do not pay.
        </p>
        <Link
          href="/kit"
          onClick={onCtaClick}
          className="inline-block w-full rounded-lg bg-accent px-6 py-4 text-center text-lg font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark"
        >
          Get my letter written and sent, $49
        </Link>
      </div>
    </div>
  );
}
