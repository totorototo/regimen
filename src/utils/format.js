// How the panels write distances, durations, paces and margins. From Waymark's format.js.

export function formatKm(meters) {
  if (!Number.isFinite(meters)) return "–";
  return `${(meters / 1000).toFixed(1)} km`;
}

// 5400 → "1h30"; 600 → "10 min"; negative durations keep their sign ("-1h30").
export function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "–";
  const sign = seconds < 0 ? "-" : "";
  const minutes = Math.round(Math.abs(seconds) / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${sign}${rest} min`;
  return `${sign}${hours}h${String(rest).padStart(2, "0")}`;
}

// 500 s/km → "8:20".
export function formatPace(secondsPerKm) {
  if (!Number.isFinite(secondsPerKm) || secondsPerKm <= 0) return "–";
  const total = Math.round(secondsPerKm);
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

// "8:20" or "8" → 500 s/km; null when it is not a pace.
export function parsePace(text) {
  const match = /^\s*(\d{1,2})(?::([0-5]\d))?\s*$/.exec(text ?? "");
  if (!match) return null;
  const seconds = Number(match[1]) * 60 + Number(match[2] ?? 0);
  return seconds > 0 ? seconds : null;
}

// A margin to a cutoff as the suite's checkpoint row writes it: 3840 → "1h04", 420 → "0h07",
// -1440 → "−0h24" (a minus sign, not a hyphen). Past 99h, "99h+".
export function formatMargin(seconds) {
  if (!Number.isFinite(seconds)) return "–";
  const minutes = Math.round(Math.abs(seconds) / 60);
  const hours = Math.floor(minutes / 60);
  const sign = seconds < 0 && minutes > 0 ? "−" : "";
  if (hours > 99) return `${sign}99h+`;
  return `${sign}${hours}h${String(minutes % 60).padStart(2, "0")}`;
}

// Time from the start as a column of arrivals writes it, always hours and minutes so the
// column lines up: 0 → "0h00", 4860 → "1h21".
export const formatElapsed = (seconds) =>
  Number.isFinite(seconds) && seconds >= 0 ? formatMargin(seconds) : "–";

// Millilitres as litres, rounded up to 10 ml: 1650 → "1.65 L", 900 → "0.9 L".
// why up: gpxz rounds carry up so the runner is never short; the label must not undo it.
export function formatLitres(ml) {
  if (!Number.isFinite(ml)) return "–";
  return `${Math.ceil(ml / 10) / 100} L`;
}

// What to leave a checkpoint with (plan.json's carry): "455 g · 1.65 L · 2.6 g Na" at a full
// point, "0.9 L" at a water point, "–" where nothing is refilled.
export function formatCarry(carry) {
  if (!carry) return "–";
  const parts = [];
  if (carry.carbs_g !== null) parts.push(`${carry.carbs_g} g`);
  parts.push(formatLitres(carry.fluid_ml));
  if (carry.sodium_mg !== null) parts.push(`${Math.ceil(carry.sodium_mg / 100) / 10} g Na`);
  return parts.join(" · ");
}
