import { describe, expect, it } from "vitest";

import { entry, fueledPlanFixture, planFixture } from "../test/fixtures.js";
import {
  checkpointType,
  effortStep,
  fuelingTotals,
  legs,
  marginScale,
  marginTier,
  verdict,
} from "./summary.js";

const cutoffs = (...margins) => [
  entry({ name: "Start", margin_s: 0 }),
  ...margins.map((margin_s, index) => entry({ name: `CP${index + 1}`, margin_s })),
];

describe("marginTier", () => {
  it("speaks Trail Suite's vocabulary: OK from an hour, Tight under it, Over past the cutoff", () => {
    expect(marginTier(3600)).toBe("ok");
    expect(marginTier(3599)).toBe("tight");
    expect(marginTier(0)).toBe("tight");
    expect(marginTier(-1)).toBe("over");
    expect(marginTier(null)).toBeNull();
  });
});

describe("verdict", () => {
  it("names the one missed cutoff first, then the tightest of the rest", () => {
    expect(verdict(cutoffs(5400, -720, 1140))).toEqual({
      tier: "over",
      text: "CP2 is past its cutoff by 0h12. Tightest of the rest: CP3, 0h19.",
    });
  });

  it("counts several missed cutoffs and names the first", () => {
    expect(verdict(cutoffs(-60, -720))).toEqual({
      tier: "over",
      text: "2 cutoffs missed, the first at CP1 (−0h01).",
    });
  });

  it("says every cutoff holds, tiered by the tightest", () => {
    expect(verdict(cutoffs(5400, 1140))).toEqual({
      tier: "tight",
      text: "Every cutoff holds. Tightest: CP2, 0h19.",
    });
    expect(verdict(cutoffs(5400, 4000)).tier).toBe("ok");
  });

  it("ignores the start's margin, and says so when there are no cutoffs", () => {
    expect(verdict([entry({ margin_s: 0 }), entry({ name: "Finish", margin_s: null })])).toEqual({
      tier: null,
      text: "No cutoffs on this course.",
    });
  });
});

describe("fuelingTotals", () => {
  it("takes the hourly targets to the finish, rounded up", () => {
    expect(fuelingTotals(fueledPlanFixture)).toEqual({
      carbs: "117 g",
      fluid: "0.84 L",
      sodium: "0.7 g",
    });
  });

  it("is nothing without fueling or a plan", () => {
    expect(fuelingTotals(planFixture)).toBeNull();
    expect(fuelingTotals(null)).toBeNull();
  });
});

describe("checkpointType", () => {
  it("writes the type as the runner reads it", () => {
    expect(checkpointType(entry({ type_name: "TimeBarrier" }))).toBe("Time barrier");
    expect(checkpointType(entry({ type_name: "Arrival" }))).toBe("Finish");
    expect(checkpointType(entry())).toBe("Start");
    expect(checkpointType(entry({ type_name: null }))).toBeNull();
  });
});

describe("marginScale", () => {
  it("takes the largest margin on either side of the cutoff, skipping the start", () => {
    // The start's own zero margin is not a cutoff, and a checkpoint without one is skipped.
    expect(marginScale(cutoffs(5400, -1800, null, 1800))).toEqual({ over_s: 1800, spare_s: 5400 });
    expect(marginScale(cutoffs(3600, 0))).toEqual({ over_s: 0, spare_s: 3600 });
  });
});

describe("legs", () => {
  it("measures the stretch before each checkpoint, on the move", () => {
    const [start, refuge, finish] = legs(planFixture.entries);
    expect(start).toBeNull();
    expect(refuge).toEqual({ distance_m: 3000, gain_m: 250, duration_s: 3600, effort: 5 });
    // Left the Refuge after its 10 min stop: 1800 s on the move, 10 m up in 3 km.
    expect(finish).toEqual({ distance_m: 3000, gain_m: 10, duration_s: 1800, effort: 1 });
  });

  it("steps effort by D+ per km, as the suite's terrain scale", () => {
    expect([0, 19.9, 20, 45, 65, 80, 200].map(effortStep)).toEqual([1, 1, 2, 3, 4, 5, 5]);
  });
});
