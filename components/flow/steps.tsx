"use client";

import type { ReactNode } from "react";
import type { FlowAnswers } from "@/lib/flow/types";
import { flowFieldValidity, type FlowStepId } from "@/lib/flow/validation";
import { DateField, NumberField, TriStateField, YesNoField } from "./FormFields";
import { DeductionsEditor } from "./DeductionsEditor";

export interface FlowStep {
  id: FlowStepId;
  title: string;
  render: (answers: FlowAnswers, update: (patch: Partial<FlowAnswers>) => void) => ReactNode;
  isValid: (answers: FlowAnswers) => boolean;
}

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
    isValid: flowFieldValidity["deposit-rent"],
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
    isValid: flowFieldValidity["dates"],
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
    isValid: flowFieldValidity["move-in-paperwork"],
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
    isValid: flowFieldValidity["move-out-paperwork"],
  },
  {
    id: "deductions",
    title: "Deductions and refund",
    render: (answers, update) => (
      <>
        <DeductionsEditor answers={answers} update={update} />
        <TriStateField
          label="Did your lease require you to have the unit professionally cleaned when you moved out?"
          helpText="Often in a move-out addendum, sometimes with a list of charges if you don't."
          value={answers.leaseRequiredProfessionalCleaning}
          onChange={(v) => update({ leaseRequiredProfessionalCleaning: v })}
        />
      </>
    ),
    isValid: flowFieldValidity["deductions"],
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
    isValid: flowFieldValidity["interest"],
  },
];
