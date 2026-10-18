import { describe, expect, it } from "vitest";

import { gpxHint, planHint } from "./hints.js";

describe("hints", () => {
  it("match gpxz's error by name, as Zig or as Zigar's words", () => {
    expect(gpxHint("CheckpointsTooFew")).toMatch(/Waymark/);
    expect(gpxHint("Checkpoints too few")).toBe(gpxHint("CheckpointsTooFew"));
    expect(planHint("Schema version unsupported")).toMatch(/newer version/);
    expect(planHint("Plan invalid")).toMatch(/don't add up/);
  });

  it("fall back for anything else", () => {
    expect(gpxHint("Something else")).toMatch(/does not look like a GPX/);
    expect(planHint("Syntax error")).toBe("It does not look like a plan.json file.");
  });
});
