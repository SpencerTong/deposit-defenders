"use client";

import { useState } from "react";
import type { LetterDetails, MailAddress } from "@/lib/db/kitOrders";

type Status = "idle" | "saving" | "error";

const emptyAddress: MailAddress = { line1: "", line2: "", city: "", state: "MA", zip: "" };

interface AddressFieldsProps {
  idPrefix: string;
  value: MailAddress;
  onChange: (value: MailAddress) => void;
}

function AddressFields({ idPrefix, value, onChange }: AddressFieldsProps) {
  const input =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-accent focus:outline-none";
  return (
    <div className="space-y-2">
      <input
        id={`${idPrefix}-line1`}
        aria-label="Street address"
        required
        placeholder="Street address"
        value={value.line1}
        onChange={(e) => onChange({ ...value, line1: e.target.value })}
        className={input}
      />
      <input
        id={`${idPrefix}-line2`}
        aria-label="Apartment or unit (optional)"
        placeholder="Apt, unit (optional)"
        value={value.line2 ?? ""}
        onChange={(e) => onChange({ ...value, line2: e.target.value })}
        className={input}
      />
      <div className="grid grid-cols-[1fr_4rem_6rem] gap-2">
        <input
          id={`${idPrefix}-city`}
          aria-label="City"
          required
          placeholder="City"
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
          className={input}
        />
        <input
          id={`${idPrefix}-state`}
          aria-label="State"
          required
          maxLength={2}
          placeholder="MA"
          value={value.state}
          onChange={(e) => onChange({ ...value, state: e.target.value.toUpperCase() })}
          className={input}
        />
        <input
          id={`${idPrefix}-zip`}
          aria-label="ZIP code"
          required
          placeholder="ZIP"
          value={value.zip}
          onChange={(e) => onChange({ ...value, zip: e.target.value })}
          className={input}
        />
      </div>
    </div>
  );
}

interface LetterDetailsFormProps {
  sessionId: string;
  initial: LetterDetails | null;
  onSaved: () => void;
}

export function LetterDetailsForm({ sessionId, initial, onSaved }: LetterDetailsFormProps) {
  const [tenantName, setTenantName] = useState(initial?.tenantName ?? "");
  const [tenantAddress, setTenantAddress] = useState<MailAddress>(
    initial?.tenantAddress ?? emptyAddress
  );
  const [landlordName, setLandlordName] = useState(initial?.landlordName ?? "");
  const [landlordAddress, setLandlordAddress] = useState<MailAddress>(
    initial?.landlordAddress ?? emptyAddress
  );
  const [propertyAddress, setPropertyAddress] = useState(initial?.propertyAddress ?? "");
  const [ownerOccupied, setOwnerOccupied] = useState<boolean | null>(
    initial ? initial.ownerOccupied : null
  );
  const [customNote, setCustomNote] = useState(initial?.customNote ?? "");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (ownerOccupied === null) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/kit/letter-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          details: {
            tenantName,
            tenantAddress,
            landlordName,
            landlordAddress,
            propertyAddress,
            ownerOccupied,
            customNote: customNote || undefined,
          },
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setStatus("idle");
      onSaved();
    } catch {
      setStatus("error");
    }
  }

  const label = "mb-1 block text-sm font-medium text-gray-900";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="tenant-name" className={label}>
          Your full name (as it should appear on the letter)
        </label>
        <input
          id="tenant-name"
          required
          value={tenantName}
          onChange={(e) => setTenantName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <p className={label}>Your current mailing address</p>
        <AddressFields idPrefix="tenant" value={tenantAddress} onChange={setTenantAddress} />
      </div>

      <div>
        <label htmlFor="property-address" className={label}>
          The rental property this deposit was for
        </label>
        <input
          id="property-address"
          required
          placeholder="45 Maple St, Unit 1, Somerville, MA 02143"
          value={propertyAddress}
          onChange={(e) => setPropertyAddress(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="landlord-name" className={label}>
          Landlord or property manager name
        </label>
        <input
          id="landlord-name"
          required
          value={landlordName}
          onChange={(e) => setLandlordName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <p className={label}>Landlord mailing address (where we send the letter)</p>
        <AddressFields idPrefix="landlord" value={landlordAddress} onChange={setLandlordAddress} />
      </div>

      <div>
        <p className={label}>Does your landlord live in your building?</p>
        <p className="mb-2 text-xs text-gray-500">
          This decides which law your letter can cite. The consumer protection act
          (Chapter 93A) generally does not reach a landlord renting out part of the home they
          live in, so we keep those letters to the security deposit law itself.
        </p>
        <div className="flex gap-3">
          {[
            { text: "Yes", val: true },
            { text: "No", val: false },
          ].map((opt) => (
            <button
              key={opt.text}
              type="button"
              onClick={() => setOwnerOccupied(opt.val)}
              className={`flex-1 rounded-lg border py-2 text-base font-medium transition-colors ${
                ownerOccupied === opt.val
                  ? "border-accent bg-accent text-white"
                  : "border-gray-300 bg-white text-gray-900 hover:border-accent"
              }`}
            >
              {opt.text}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="custom-note" className={label}>
          Anything to add? (optional, included as its own paragraph)
        </label>
        <textarea
          id="custom-note"
          rows={3}
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === "saving" || ownerOccupied === null}
        className="w-full rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Save and update my letter"}
      </button>
      {ownerOccupied === null && (
        <p className="text-center text-xs text-gray-500">
          Answer the landlord question above to continue.
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600">Could not save. Check the fields and try again.</p>
      )}
    </form>
  );
}
