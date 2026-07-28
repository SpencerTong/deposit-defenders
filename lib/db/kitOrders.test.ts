import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });

vi.mock("@/lib/db/client", () => ({
  getPool: () => ({ query: queryMock }),
}));

import { setKitOrderAnswers } from "./kitOrders";
import { initialFlowAnswers } from "@/lib/flow/types";

beforeEach(() => {
  queryMock.mockClear();
});

describe("setKitOrderAnswers", () => {
  it("appends the prior answers to history and overwrites answers in one query", async () => {
    const newAnswers = { ...initialFlowAnswers, depositAmount: "2000" };
    await setKitOrderAnswers("o1", newAnswers);

    expect(queryMock).toHaveBeenCalledTimes(1);
    const [sql, params] = queryMock.mock.calls[0]!;
    expect(sql).toContain("answers_history = answers_history ||");
    expect(sql).toContain("answers = $2");
    expect(sql).toContain("WHERE id = $1");
    expect(params[0]).toBe("o1");
    expect(JSON.parse(params[1])).toEqual(newAnswers);
  });
});
