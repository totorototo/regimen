import { describe, expect, it } from "vitest";

import { entry, fueledPlanFixture, planFixture } from "../test/fixtures.js";
import { checkpointMeta, fuelingTotals, marginTier, verdict } from "./summary.js";

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

describe("checkpointMeta", () => {
  it("writes the type as the runner reads it, the distance and the gain so far", () => {
    const barrier = entry({
      type_name: "TimeBarrier",
      distance_m: 21900,
      elevation_gain_m: 2150.4,
    });
    expect(checkpointMeta(barrier)).toBe("Time barrier · 21.9 km · D+ 2150 m");
    expect(checkpointMeta(entry())).toBe("Start · 0.0 km");
    expect(checkpointMeta(entry({ type_name: null, distance_m: 1500 }))).toBe("1.5 km");
  });
});
