import { formatPace, parsePace } from "../utils/format.js";

// The pace model's inputs, gpxz's defaults (the "Moderate" preset). Fueling is off: null.
export const DEFAULT_SETTINGS = {
  pace_base_s_per_km: 500,
  fatigue_coefficient: 0.002,
  life_base_stop_s: 3600,
  fueling: null,
};

// What the fueling fields start from when the runner turns fueling on. gpxz has no defaults
// for these: they are a common ultra starting point, for the runner to change.
export const DEFAULT_FUELING = {
  carbs_g_per_h: 60,
  fluid_ml_per_h: 500,
  sodium_mg_per_h: 400,
  reserve_s: 30 * 60,
};

// What a checkpoint refills: nothing, fluid only, or everything (gpxz's fueling.Supply).
export const SUPPLIES = ["none", "water", "full"];

// The bounds zig/regimen.zig enforces. Keep them in step: the form refuses what gpxz would,
// so a typo shows on its field instead of as an error from the worker.
export const BOUNDS = {
  pace_base_s_per_km: { min: 120, max: 3600 },
  fatigue_coefficient: { min: 0, max: 0.05 },
  life_base_stop_s: { min: 0, max: 24 * 3600 },
  carbs_g_per_h: { min: 0, max: 150 },
  fluid_ml_per_h: { min: 0, max: 1500 },
  sodium_mg_per_h: { min: 0, max: 3000 },
  reserve_s: { min: 0, max: 180 * 60 },
};

// The supply gpxz gives a checkpoint the runner hasn't chosen for (fueling.supplies_default):
// full at the Start and every LifeBase. Keep it in step with gpxz.
// why mirrored, not asked for: it only marks a choice that differs from the default; the plan
// itself always takes gpxz's resolved supplies.
export const supplyDefault = (entry) =>
  entry.type_name === "Start" || entry.type_name === "LifeBase" ? "full" : "none";

// What the form shows for settings: the pace as m:ss, the LifeBase stop and the reserve in
// minutes. The fueling fields keep their last values (or the defaults) while fueling is off.
export function formFromSettings(settings) {
  const fueling = settings.fueling ?? DEFAULT_FUELING;
  return {
    pace: formatPace(settings.pace_base_s_per_km),
    fatigue: String(settings.fatigue_coefficient),
    lifeBaseStopMin: String(Math.round(settings.life_base_stop_s / 60)),
    fueling: settings.fueling != null,
    carbs: String(fueling.carbs_g_per_h),
    fluid: String(fueling.fluid_ml_per_h),
    sodium: String(fueling.sodium_mg_per_h),
    reserveMin: String(Math.round(fueling.reserve_s / 60)),
  };
}

const within = (value, { min, max }) => Number.isFinite(value) && value >= min && value <= max;
const number = (text) => (text.trim() === "" ? NaN : Number(text));
const minutes = (text) => {
  const value = number(text);
  return Number.isInteger(value) ? value * 60 : NaN;
};

// The fueling fields as gpxz's fueling settings, with their errors. Nothing when it is off.
function fuelingFromForm(form, supplies) {
  if (!form.fueling) return { fueling: null, errors: {} };
  const fueling = {
    carbs_g_per_h: number(form.carbs),
    fluid_ml_per_h: number(form.fluid),
    sodium_mg_per_h: number(form.sodium),
    reserve_s: minutes(form.reserveMin),
    supplies,
  };
  const errors = {};
  if (!within(fueling.carbs_g_per_h, BOUNDS.carbs_g_per_h)) errors.carbs = "From 0 to 150 g.";
  if (!within(fueling.fluid_ml_per_h, BOUNDS.fluid_ml_per_h)) errors.fluid = "From 0 to 1500 ml.";
  if (!within(fueling.sodium_mg_per_h, BOUNDS.sodium_mg_per_h)) {
    errors.sodium = "From 0 to 3000 mg.";
  }
  if (!within(fueling.reserve_s, BOUNDS.reserve_s)) {
    errors.reserveMin = "Whole minutes, from 0 to 180.";
  }
  return { fueling, errors };
}

// The form's text read back as settings, or the fields that don't parse or fall outside the
// bounds. why all fields at once: one wrong field must not hide another. `supplies` is the
// runner's refill per checkpoint, or [] for the course's defaults: the table sets it, not
// the form.
export function settingsFromForm(form, supplies = []) {
  const pace = parsePace(form.pace);
  const fueling = fuelingFromForm(form, supplies);
  const settings = {
    pace_base_s_per_km: pace ?? NaN,
    fatigue_coefficient: number(form.fatigue),
    life_base_stop_s: minutes(form.lifeBaseStopMin),
    fueling: fueling.fueling,
  };
  const errors = { ...fueling.errors };
  if (!within(settings.pace_base_s_per_km, BOUNDS.pace_base_s_per_km)) {
    errors.pace = "A pace from 2:00 to 60:00 per km, as m:ss.";
  }
  if (!within(settings.fatigue_coefficient, BOUNDS.fatigue_coefficient)) {
    errors.fatigue = "A coefficient from 0 to 0.05.";
  }
  if (!within(settings.life_base_stop_s, BOUNDS.life_base_stop_s)) {
    errors.lifeBaseStopMin = "Whole minutes, from 0 to 1440.";
  }
  return Object.keys(errors).length > 0 ? { errors } : { settings };
}

// "race.gpx" → "race.plan.json": named after the course, and the .gitignore keeps it out of
// a repo.
export function planFileName(gpxName) {
  const base = (gpxName ?? "course.gpx").replace(/\.gpx$/i, "");
  return `${base}.plan.json`;
}
