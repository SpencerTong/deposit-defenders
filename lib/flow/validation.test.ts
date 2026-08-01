import { describe, expect, it } from "vitest";
import { isCompleteFlowAnswers, isNonNegativeAmount, isValidDateString } from "./validation";
import { initialFlowAnswers, type FlowAnswers } from "./types";

const complete: FlowAnswers = {
  ...initialFlowAnswers,
  depositAmount: "2000",
  monthlyRent: "1800",
  tenancyStartDate: "2023-06-01",
  moveOutDate: "2026-05-31",
  tenancyEndConfirmed: true,
  receivedItemizedList: false,
  amountReturned: "0",
};

describe("isNonNegativeAmount", () => {
  it("accepts zero and positive numeric strings", () => {
    expect(isNonNegativeAmount("0")).toBe(true);
    expect(isNonNegativeAmount("2000")).toBe(true);
  });

  it("rejects empty, negative, or non-numeric strings", () => {
    expect(isNonNegativeAmount("")).toBe(false);
    expect(isNonNegativeAmount("-5")).toBe(false);
  });
});

describe("isValidDateString", () => {
  it("accepts a well-formed ISO date", () => {
    expect(isValidDateString("2023-06-01")).toBe(true);
  });

  it("rejects a garbage string", () => {
    expect(isValidDateString("banana")).toBe(false);
  });
});

describe("isCompleteFlowAnswers", () => {
  it("accepts a fully answered flow", () => {
    expect(isCompleteFlowAnswers(complete)).toBe(true);
  });

  it("rejects a missing deposit amount", () => {
    expect(isCompleteFlowAnswers({ ...complete, depositAmount: "" })).toBe(false);
  });

  it("rejects tenancy dates left blank", () => {
    expect(isCompleteFlowAnswers({ ...complete, tenancyStartDate: "" })).toBe(false);
  });

  it("rejects an unparseable tenancy start date", () => {
    expect(isCompleteFlowAnswers({ ...complete, tenancyStartDate: "banana" })).toBe(false);
  });

  it("requires an itemized-list date only when a list was received", () => {
    expect(
      isCompleteFlowAnswers({ ...complete, receivedItemizedList: true, itemizedListDate: "" })
    ).toBe(false);
    expect(
      isCompleteFlowAnswers({
        ...complete,
        receivedItemizedList: true,
        itemizedListDate: "2024-01-01",
      })
    ).toBe(true);
  });

  it("rejects a negative amount returned", () => {
    expect(isCompleteFlowAnswers({ ...complete, amountReturned: "-1" })).toBe(false);
  });
});
