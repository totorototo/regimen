import { formatPace, parsePace } from "../utils/format.js";

// The pace model's inputs, gpxz's defaults (the "Moderate" preset).
export const DEFAULT_SETTINGS = {
  pace_base_s_per_km: 500,
  fatigue_coefficient: 0.002,
  life_base_stop_s: 3600,
};

// The bounds zig/regimen.zig enforces. Keep them in step: the form refuses what gpxz would,
// so a typo shows on its field instead of as an error from the worker.
export const BOUNDS = {
  pace_base_s_per_km: { min: 120, max: 3600 },
  fatigue_coefficient: { min: 0, max: 0.05 },
  life_base_stop_s: { min: 0, max: 24 * 3600 },
};

// What the form shows for settings: the pace as m:ss, the LifeBase stop in minutes.
export function formFromSettings(settings) {
  return {
    pace: formatPace(settings.pace_base_s_per_km),
    fatigue: String(settings.fatigue_coefficient),
    lifeBaseStopMin: String(Math.round(settings.life_base_stop_s / 60)),
  };
}

const within = (value, { min, max }) => Number.isFinite(value) && value >= min && value <= max;

// The form's text read back as settings, or the fields that don't parse or fall outside the
// bounds. why all fields at once: one wrong field must not hide another.
export function settingsFromForm(form) {
  const pace = parsePace(form.pace);
  const fatigue = form.fatigue.trim() === "" ? NaN : Number(form.fatigue);
  const stopMin = form.lifeBaseStopMin.trim() === "" ? NaN : Number(form.lifeBaseStopMin);
  const settings = {
    pace_base_s_per_km: pace ?? NaN,
    fatigue_coefficient: fatigue,
    life_base_stop_s: Number.isInteger(stopMin) ? stopMin * 60 : NaN,
  };
  const errors = {};
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
