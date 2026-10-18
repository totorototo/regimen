import { describe, expect, it } from "vitest";

import {
  BOUNDS,
  DEFAULT_SETTINGS,
  formFromSettings,
  planFileName,
  settingsFromForm,
} from "./settings.js";

const form = (overrides = {}) => ({ ...formFromSettings(DEFAULT_SETTINGS), ...overrides });

describe("formFromSettings / settingsFromForm", () => {
  it("round-trips the defaults", () => {
    expect(formFromSettings(DEFAULT_SETTINGS)).toEqual({
      pace: "8:20",
      fatigue: "0.002",
      lifeBaseStopMin: "60",
    });
    expect(settingsFromForm(form())).toEqual({ settings: DEFAULT_SETTINGS });
  });

  it("accepts each bound, and refuses one step past it", () => {
    const ok = (overrides) => settingsFromForm(form(overrides)).settings;
    expect(ok({ pace: "2:00" }).pace_base_s_per_km).toBe(BOUNDS.pace_base_s_per_km.min);
    expect(ok({ pace: "60:00" }).pace_base_s_per_km).toBe(BOUNDS.pace_base_s_per_km.max);
    expect(ok({ fatigue: "0" }).fatigue_coefficient).toBe(0);
    expect(ok({ fatigue: "0.05" }).fatigue_coefficient).toBe(0.05);
    expect(ok({ lifeBaseStopMin: "0" }).life_base_stop_s).toBe(0);
    expect(ok({ lifeBaseStopMin: "1440" }).life_base_stop_s).toBe(86400);

    const bad = (overrides) => settingsFromForm(form(overrides)).errors;
    expect(bad({ pace: "1:59" })).toHaveProperty("pace");
    expect(bad({ pace: "60:01" })).toHaveProperty("pace");
    expect(bad({ fatigue: "-0.001" })).toHaveProperty("fatigue");
    expect(bad({ fatigue: "0.051" })).toHaveProperty("fatigue");
    expect(bad({ lifeBaseStopMin: "-1" })).toHaveProperty("lifeBaseStopMin");
    expect(bad({ lifeBaseStopMin: "1441" })).toHaveProperty("lifeBaseStopMin");
  });

  it("refuses text that is not a number, and reports every bad field", () => {
    const { errors } = settingsFromForm({ pace: "fast", fatigue: "", lifeBaseStopMin: "2.5" });
    expect(Object.keys(errors).sort()).toEqual(["fatigue", "lifeBaseStopMin", "pace"]);
    expect(settingsFromForm(form({ fatigue: "abc" })).errors).toHaveProperty("fatigue");
  });
});

describe("planFileName", () => {
  it("names the plan after the course", () => {
    expect(planFileName("grp-80.gpx")).toBe("grp-80.plan.json");
    expect(planFileName("Race.GPX")).toBe("Race.plan.json");
    expect(planFileName(null)).toBe("course.plan.json");
  });
});
