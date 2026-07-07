"use client";

import type { ReactNode } from "react";
import type { FlowAnswers } from "@/lib/flow/types";
import { DateField, NumberField, TriStateField, YesNoField } from "./FormFields";
import { DeductionsEditor } from "./DeductionsEditor";

export interface FlowStep {
  id: string;
  title: string;
  render: (answers: FlowAnswers, update: (patch: Partial<FlowAnswers>) => void) => ReactNode;
  isValid: (answers: FlowAnswers) => boolean;
}

const isNonNegativeNumber = (value: string) => value.trim() !== "" && Number(value) >= 0;

export const flowSteps: FlowStep[] = [
  {
    id: "deposit-rent",
    title: "Your deposit and rent",
    render: (answers, update) => (
      <>
        <NumberField
          label="How much was your security deposit?"
          value={answers.depositAmount}
          onChange={(v) => update({ depositAmount: v })}
          prefix="$"
        />
        <NumberField
          label="What is/was your monthly rent?"
          value={answers.monthlyRent}
          onChange={(v) => update({ monthlyRent: v })}
          prefix="$"
        />
      </>
    ),
    isValid: (a) => isNonNegativeNumber(a.depositAmount) && isNonNegativeNumber(a.monthlyRent),
  },
  {
    id: "dates",
    title: "Your tenancy dates",
    render: (answers, update) => (
      <>
        <DateField
          label="When did your tenancy start?"
          value={answers.tenancyStartDate}
          onChange={(v) => update({ tenancyStartDate: v })}
        />
        <DateField
          label="When did you move out (or plan to)?"
          value={answers.moveOutDate}
          onChange={(v) => update({ moveOutDate: v })}
        />
        <YesNoField
          label="Has your tenancy officially ended (lease ended or you gave proper notice)?"
          value={answers.tenancyEndConfirmed}
          onChange={(v) => update({ tenancyEndConfirmed: v })}
        />
      </>
    ),
    isValid: (a) =>
      a.tenancyStartDate !== "" && a.moveOutDate !== "" && a.tenancyEndConfirmed !== null,
  },
  {
    id: "move-in-paperwork",
    title: "Move-in paperwork",
    render: (answers, update) => (
      <>
        <TriStateField
          label="Did your landlord give you a receipt with the bank name and account number where your deposit is held?"
          helpText="Massachusetts law requires this within 30 days of paying the deposit."
          value={answers.receivedBankReceipt}
          onChange={(v) => update({ receivedBankReceipt: v })}
        />
        <TriStateField
          label="Did your landlord give you a written statement of the unit's condition at move-in?"
          value={answers.receivedStatementOfCondition}
          onChange={(v) => update({ receivedStatementOfCondition: v })}
        />
      </>
    ),
    isValid: () => true,
  },
  {
    id: "move-out-paperwork",
    title: "Move-out paperwork",
    render: (answers, update) => (
      <>
        <YesNoField
          label="Did your landlord give you an itemized list of damages after you moved out?"
          value={answers.receivedItemizedList}
          onChange={(v) => update({ receivedItemizedList: v })}
        />
        {answers.receivedItemizedList && (
          <>
            <DateField
              label="What date did you receive that list?"
              value={answers.itemizedListDate}
              onChange={(v) => update({ itemizedListDate: v })}
            />
            <TriStateField
              label={'Was the list signed/sworn "under pains and penalties of perjury"?'}
              value={answers.listSwornUnderPenalty}
              onChange={(v) => update({ listSwornUnderPenalty: v })}
            />
          </>
        )}
      </>
    ),
    isValid: (a) =>
      a.receivedItemizedList !== null && (!a.receivedItemizedList || a.itemizedListDate !== ""),
  },
  {
    id: "deductions",
    title: "Deductions and refund",
    render: (answers, update) => <DeductionsEditor answers={answers} update={update} />,
    isValid: (a) => isNonNegativeNumber(a.amountReturned),
  },
  {
    id: "interest",
    title: "Interest on your deposit",
    render: (answers, update) => (
      <TriStateField
        label="If you've had this deposit for a year or more, did your landlord pay you annual interest on it?"
        helpText="Massachusetts requires 5% annual interest on deposits held a year or longer."
        value={answers.interestPaidAnnually}
        onChange={(v) => update({ interestPaidAnnually: v })}
      />
    ),
    isValid: () => true,
  },
];
