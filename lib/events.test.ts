import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The events module reads `window` at call time, so a minimal stub is enough
// and keeps this suite on the fast node environment like the rest of the repo.
function installWindow(storage: Storage) {
  vi.stubGlobal("window", {
    sessionStorage: storage,
    location: { pathname: "/", search: "" },
  });
}

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  fetchMock = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("trackEventOnce", () => {
  it("sends the first time a stage is reached", async () => {
    installWindow(memoryStorage());
    const { trackEventOnce } = await import("./events");

    trackEventOnce("landed");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string);
    expect(body.name).toBe("landed");
  });

  it("does not resend the same stage within a session, which is what caused landed to overcount", async () => {
    installWindow(memoryStorage());
    const { trackEventOnce } = await import("./events");

    trackEventOnce("landed");
    trackEventOnce("landed");
    trackEventOnce("landed");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("tracks each stage independently", async () => {
    installWindow(memoryStorage());
    const { trackEventOnce } = await import("./events");

    trackEventOnce("landed");
    trackEventOnce("started");
    trackEventOnce("landed");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const names = fetchMock.mock.calls.map(
      (c) => JSON.parse(c[1].body as string).name as string
    );
    expect(names).toEqual(["landed", "started"]);
  });

  it("still sends when sessionStorage throws, since losing the event is worse than double counting", async () => {
    const throwing = {
      getItem: () => {
        throw new Error("blocked in private mode");
      },
      setItem: () => {
        throw new Error("blocked in private mode");
      },
    } as unknown as Storage;
    installWindow(throwing);
    const { trackEventOnce } = await import("./events");

    trackEventOnce("landed");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("is inert during server rendering", async () => {
    vi.stubGlobal("window", undefined);
    const { trackEventOnce } = await import("./events");

    trackEventOnce("landed");

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
