"use client";

import type { TriState } from "@/lib/statute/ma";

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-base font-medium text-gray-900">{children}</label>;
}

export function NumberField({
  label,
  value,
  onChange,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
}) {
  return (
    <div className="mb-6">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            {prefix}
          </span>
        )}
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border border-gray-300 py-3 text-lg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
            prefix ? "pl-8 pr-4" : "px-4"
          }`}
        />
      </div>
    </div>
  );
}

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-6">
      <FieldLabel>{label}</FieldLabel>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </div>
  );
}

export function YesNoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="mb-6">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex gap-3">
        {[
          { label: "Yes", val: true },
          { label: "No", val: false },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.val)}
            className={`flex-1 rounded-lg border py-3 text-lg font-medium transition-colors ${
              value === opt.val
                ? "border-accent bg-accent text-white"
                : "border-gray-300 bg-white text-gray-900 hover:border-accent"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TriStateField({
  label,
  value,
  onChange,
  helpText,
}: {
  label: string;
  value: TriState | null;
  onChange: (value: TriState) => void;
  helpText?: string;
}) {
  const options: { label: string; val: TriState }[] = [
    { label: "Yes", val: "yes" },
    { label: "No", val: "no" },
    { label: "Not sure", val: "unknown" },
  ];
  return (
    <div className="mb-6">
      <FieldLabel>{label}</FieldLabel>
      {helpText && <p className="mb-3 text-sm text-gray-500">{helpText}</p>}
      <div className="flex gap-3">
        {options.map((opt) => (
          <button
            key={opt.val}
            type="button"
            onClick={() => onChange(opt.val)}
            className={`flex-1 rounded-lg border py-3 text-base font-medium transition-colors ${
              value === opt.val
                ? "border-accent bg-accent text-white"
                : "border-gray-300 bg-white text-gray-900 hover:border-accent"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
