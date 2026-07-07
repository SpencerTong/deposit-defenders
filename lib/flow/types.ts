import type { TriState } from "@/lib/statute/ma";

export interface DeductionDraft {
  description: string;
  amount: string;
}

export interface FlowAnswers {
  depositAmount: string;
  monthlyRent: string;
  tenancyStartDate: string;
  moveOutDate: string;
  tenancyEndConfirmed: boolean | null;
  receivedBankReceipt: TriState | null;
  receivedStatementOfCondition: TriState | null;
  receivedItemizedList: boolean | null;
  itemizedListDate: string;
  listSwornUnderPenalty: TriState | null;
  deductionsClaimed: DeductionDraft[];
  amountReturned: string;
  interestPaidAnnually: TriState | null;
}

export const initialFlowAnswers: FlowAnswers = {
  depositAmount: "",
  monthlyRent: "",
  tenancyStartDate: "",
  moveOutDate: "",
  tenancyEndConfirmed: null,
  receivedBankReceipt: null,
  receivedStatementOfCondition: null,
  receivedItemizedList: null,
  itemizedListDate: "",
  listSwornUnderPenalty: null,
  deductionsClaimed: [],
  amountReturned: "",
  interestPaidAnnually: null,
};
