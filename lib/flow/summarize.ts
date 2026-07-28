import type { FlowAnswers } from "./types";

function formatDate(value: string): string {
  if (!value) return "not set";
  const [year, month, day] = value.split("-");
  return `${month}/${day}/${year}`;
}

export function summarizeFlowAnswers(a: FlowAnswers): string {
  const deposit = a.depositAmount ? `$${a.depositAmount}` : "no deposit amount on file";
  const rent = a.monthlyRent ? `$${a.monthlyRent}/mo` : "no rent amount on file";
  const count = a.deductionsClaimed.length;
  const total = a.deductionsClaimed.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const deductionsText =
    count === 0
      ? "no deductions claimed"
      : `${count} deduction${count === 1 ? "" : "s"} claimed ($${total})`;

  return (
    `${deposit} deposit on ${rent} rent, tenancy ${formatDate(a.tenancyStartDate)} to ` +
    `${formatDate(a.moveOutDate)}. ${deductionsText}, $${a.amountReturned || "0"} returned.`
  );
}
