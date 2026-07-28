import type { FlowAnswers } from "./types";

export function isNonNegativeAmount(value: string): boolean {
  return value.trim() !== "" && Number(value) >= 0;
}

/** Accepts only an ISO `YYYY-MM-DD` shape that also parses to a real date. */
export function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));
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
  dates: (a) =>
    isValidDateString(a.tenancyStartDate) &&
    isValidDateString(a.moveOutDate) &&
    a.tenancyEndConfirmed !== null,
  "move-in-paperwork": () => true,
  "move-out-paperwork": (a) =>
    a.receivedItemizedList !== null &&
    (!a.receivedItemizedList || isValidDateString(a.itemizedListDate)),
  deductions: (a) => isNonNegativeAmount(a.amountReturned),
  interest: () => true,
};

export function isCompleteFlowAnswers(a: FlowAnswers): boolean {
  return Object.values(flowFieldValidity).every((check) => check(a));
}
