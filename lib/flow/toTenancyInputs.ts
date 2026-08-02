import type { Deduction, TenancyInputs, TriState } from "@/lib/statute/ma";
import type { FlowAnswers } from "./types";

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toTriState(value: TriState | null): TriState {
  return value ?? "unknown";
}

export function toTenancyInputs(answers: FlowAnswers): TenancyInputs {
  const receivedItemizedList = answers.receivedItemizedList ?? false;

  const deductionsClaimed: Deduction[] = answers.deductionsClaimed
    .filter((d) => d.description.trim().length > 0 && d.amount.trim().length > 0)
    .map((d) => ({ description: d.description.trim(), amount: toNumber(d.amount) }));

  return {
    depositAmount: toNumber(answers.depositAmount),
    monthlyRent: toNumber(answers.monthlyRent),
    tenancyStartDate: new Date(answers.tenancyStartDate),
    moveOutDate: new Date(answers.moveOutDate),
    tenancyEndConfirmed: answers.tenancyEndConfirmed ?? true,
    receivedItemizedList,
    itemizedListDate:
      receivedItemizedList && answers.itemizedListDate
        ? new Date(answers.itemizedListDate)
        : undefined,
    listSwornUnderPenalty: toTriState(answers.listSwornUnderPenalty),
    receivedBankReceipt: toTriState(answers.receivedBankReceipt),
    receivedStatementOfCondition: toTriState(answers.receivedStatementOfCondition),
    deductionsClaimed,
    amountReturned: toNumber(answers.amountReturned),
    interestPaidAnnually: toTriState(answers.interestPaidAnnually),
    leaseRequiredProfessionalCleaning: toTriState(answers.leaseRequiredProfessionalCleaning),
  };
}
