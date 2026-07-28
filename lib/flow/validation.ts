import type { FlowAnswers } from "./types";

export function isNonNegativeAmount(value: string): boolean {
  return value.trim() !== "" && Number(value) >= 0;
}

export type FlowStepId =
  | "deposit-rent"
  | "dates"
  | "move-in-paperwork"
  | "move-out-paperwork"
  | "deductions"
  | "interest";

export const flowFieldValidity: Record<FlowStepId, (a: FlowAnswers) => boolean> = {
  "deposit-rent": (a) => isNonNegativeAmount(a.depositAmount) && isNonNegativeAmount(a.monthlyRent),
  dates: (a) => a.tenancyStartDate !== "" && a.moveOutDate !== "" && a.tenancyEndConfirmed !== null,
  "move-in-paperwork": () => true,
  "move-out-paperwork": (a) =>
    a.receivedItemizedList !== null && (!a.receivedItemizedList || a.itemizedListDate !== ""),
  deductions: (a) => isNonNegativeAmount(a.amountReturned),
  interest: () => true,
};

export function isCompleteFlowAnswers(a: FlowAnswers): boolean {
  return Object.values(flowFieldValidity).every((check) => check(a));
}
