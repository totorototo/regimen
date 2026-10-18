import { beforeEach, describe, expect, it, vi } from "vitest";

// The real module is compiled by Zigar at build time: unit tests stand in for it and leave
// the real round trip to the build check (scripts/check-wasm.mjs).
vi.mock("../../zig/regimen.zig", () => {
  const slice = (text) => ({ string: text });
  return {
    __zigar: { init: vi.fn(async () => {}) },
    buildPlan: vi.fn(async () => slice('{\n  "schema_version": 1\n}\n')),
    openPlan: vi.fn(async () => slice('{"course_matches":true}')),
  };
});

const zig = await import("../../zig/regimen.zig");
const { handleMessage } = await import("./regimen.worker.js");

const bytes = (...values) => new Uint8Array(values).buffer;

describe("handleMessage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses a plan before a course is open", async () => {
    const { error } = await handleMessage({ id: 1, type: "buildPlan", payload: { settings: {} } });
    expect(error).toBe("No course loaded");
    expect(zig.buildPlan).not.toHaveBeenCalled();
  });

  it("loads a course and hands back plan.json as text and as an object", async () => {
    const settings = { pace_base_s_per_km: 420 };
    const { id, result } = await handleMessage({
      id: 7,
      type: "loadCourse",
      payload: { gpx: bytes(1, 2, 3), settings },
    });
    expect(id).toBe(7);
    expect(result.text).toBe('{\n  "schema_version": 1\n}\n');
    expect(result.plan).toEqual({ schema_version: 1 });
    const [course, passed] = zig.buildPlan.mock.calls[0];
    expect([...course]).toEqual([1, 2, 3]);
    expect(passed).toBe(settings);
  });

  it("rebuilds and opens plans against the course it keeps", async () => {
    await handleMessage({ id: 1, type: "loadCourse", payload: { gpx: bytes(9), settings: {} } });
    await handleMessage({ id: 2, type: "buildPlan", payload: { settings: { x: 1 } } });
    expect([...zig.buildPlan.mock.calls[1][0]]).toEqual([9]);

    const { result } = await handleMessage({
      id: 3,
      type: "openPlan",
      payload: { plan: bytes(7) },
    });
    expect(result).toEqual({ course_matches: true });
    const [plan, course] = zig.openPlan.mock.calls[0];
    expect([...plan]).toEqual([7]);
    expect([...course]).toEqual([9]);
  });

  it("keeps the open course when gpxz refuses a new one", async () => {
    await handleMessage({ id: 1, type: "loadCourse", payload: { gpx: bytes(5), settings: {} } });
    zig.buildPlan.mockRejectedValueOnce(new Error("Checkpoints too few"));
    const refused = await handleMessage({
      id: 2,
      type: "loadCourse",
      payload: { gpx: bytes(6), settings: {} },
    });
    expect(refused.error).toBe("Checkpoints too few");
    await handleMessage({ id: 3, type: "buildPlan", payload: { settings: {} } });
    expect([...zig.buildPlan.mock.calls.at(-1)[0]]).toEqual([5]);
  });

  it("answers an unknown request with an error", async () => {
    expect(await handleMessage({ id: 4, type: "nope" })).toEqual({
      id: 4,
      error: "Unknown request: nope",
    });
  });
});
