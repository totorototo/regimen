import { describe, expect, it } from "vitest";

import {
  BOUNDS,
  DEFAULT_FUELING,
  DEFAULT_SETTINGS,
  formFromSettings,
  planFileName,
  settingsFromForm,
  slowestStep,
  stepText,
  supplyDefault,
} from "./settings.js";

const form = (overrides = {}) => ({ ...formFromSettings(DEFAULT_SETTINGS), ...overrides });

describe("formFromSettings / settingsFromForm", () => {
  it("round-trips the defaults", () => {
    expect(formFromSettings(DEFAULT_SETTINGS)).toEqual({
      pace: "8:20",
      fatigue: "0.002",
      lifeBaseStopMin: "60",
      fueling: false,
      carbs: "60",
      fluid: "500",
      sodium: "400",
      reserveMin: "30",
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
    const { errors } = settingsFromForm(
      form({ pace: "fast", fatigue: "", lifeBaseStopMin: "2.5" }),
    );
    expect(Object.keys(errors).sort()).toEqual(["fatigue", "lifeBaseStopMin", "pace"]);
    expect(settingsFromForm(form({ fatigue: "abc" })).errors).toHaveProperty("fatigue");
  });
});

describe("fueling", () => {
  const fueled = { ...DEFAULT_SETTINGS, fueling: { ...DEFAULT_FUELING, supplies: [] } };

  it("is off by default, and its fields are ignored while it is", () => {
    expect(settingsFromForm(form({ carbs: "lots" }))).toEqual({ settings: DEFAULT_SETTINGS });
  });

  it("round-trips when on, with the table's supplies passed through", () => {
    expect(formFromSettings(fueled).fueling).toBe(true);
    expect(settingsFromForm(form({ fueling: true }))).toEqual({ settings: fueled });
    const supplies = ["full", "water", "none"];
    const { settings } = settingsFromForm(form({ fueling: true }), supplies);
    expect(settings.fueling.supplies).toBe(supplies);
  });

  it("accepts each bound, and refuses one step past it", () => {
    const on = (overrides) => form({ fueling: true, ...overrides });
    const ok = (overrides) => settingsFromForm(on(overrides)).settings.fueling;
    expect(ok({ carbs: "0" }).carbs_g_per_h).toBe(BOUNDS.carbs_g_per_h.min);
    expect(ok({ carbs: "150" }).carbs_g_per_h).toBe(BOUNDS.carbs_g_per_h.max);
    expect(ok({ fluid: "1500" }).fluid_ml_per_h).toBe(BOUNDS.fluid_ml_per_h.max);
    expect(ok({ sodium: "3000" }).sodium_mg_per_h).toBe(BOUNDS.sodium_mg_per_h.max);
    expect(ok({ reserveMin: "0" }).reserve_s).toBe(0);
    expect(ok({ reserveMin: "180" }).reserve_s).toBe(BOUNDS.reserve_s.max);

    const bad = (overrides) => settingsFromForm(on(overrides)).errors;
    expect(bad({ carbs: "-1" })).toHaveProperty("carbs");
    expect(bad({ carbs: "151" })).toHaveProperty("carbs");
    expect(bad({ fluid: "1501" })).toHaveProperty("fluid");
    expect(bad({ sodium: "3001" })).toHaveProperty("sodium");
    expect(bad({ sodium: "" })).toHaveProperty("sodium");
    expect(bad({ reserveMin: "181" })).toHaveProperty("reserveMin");
    expect(bad({ reserveMin: "1.5" })).toHaveProperty("reserveMin");
  });

  it("defaults full at the Start and every LifeBase, as gpxz does", () => {
    expect(supplyDefault({ type_name: "Start" })).toBe("full");
    expect(supplyDefault({ type_name: "LifeBase" })).toBe("full");
    expect(supplyDefault({ type_name: "TimeBarrier" })).toBe("none");
    expect(supplyDefault({ type_name: null })).toBe("none");
  });
});

describe("planFileName", () => {
  it("names the plan after the course", () => {
    expect(planFileName("grp-80.gpx")).toBe("grp-80.plan.json");
    expect(planFileName("Race.GPX")).toBe("Race.plan.json");
    expect(planFileName(null)).toBe("course.plan.json");
  });
});

describe("stepText", () => {
  it("steps each field by its own step, in the form's units", () => {
    expect(stepText("pace", "8:20", 1)).toBe("8:25");
    expect(stepText("pace", "8:20", -1)).toBe("8:15");
    expect(stepText("fatigue", "0.002", 1)).toBe("0.0025");
    expect(stepText("lifeBaseStopMin", "60", -1)).toBe("55");
    expect(stepText("fluid", "500", 1)).toBe("550");
  });

  it("snaps an off-step value to the next round one", () => {
    expect(stepText("pace", "8:22", 1)).toBe("8:25");
    expect(stepText("pace", "8:22", -1)).toBe("8:20");
    expect(stepText("carbs", "62", 1)).toBe("65");
  });

  it("stops at the bounds gpxz enforces", () => {
    expect(stepText("pace", "2:00", -1)).toBeNull();
    expect(stepText("fatigue", "0", -1)).toBeNull();
    expect(stepText("carbs", "150", 1)).toBeNull();
    expect(stepText("carbs", "148", 1)).toBe("150");
  });

  it("leaves a value that does not parse to the runner's typing", () => {
    expect(stepText("pace", "quick", 1)).toBeNull();
    expect(stepText("carbs", "", 1)).toBeNull();
  });
});

describe("slowestStep", () => {
  it("rounds the slowest pace down to the stepper's grid, never past the fastest", () => {
    expect(slowestStep(492)).toBe(490);
    expect(slowestStep(495)).toBe(495);
    expect(slowestStep(121)).toBe(120);
  });
});
