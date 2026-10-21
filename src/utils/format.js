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

// 7200 → "UTC+2", -16200 → "UTC−4:30", 0 or null → "UTC". From Retrace's format.js.
export function formatUtcOffset(utc_offset_s) {
  if (!utc_offset_s) return "UTC";
  const minutes = Math.round(Math.abs(utc_offset_s) / 60);
  const [hours, rest] = [Math.floor(minutes / 60), minutes % 60];
  return `UTC${utc_offset_s > 0 ? "+" : "−"}${hours}${rest ? `:${String(rest).padStart(2, "0")}` : ""}`;
}

// The clock times are read on: the race's, from the course's offset, or else the device's.
// why shift and read on UTC: Retrace's way with the watch's offset; Intl's offset zones
// ("+02:00") aren't in every browser yet.
export function raceClock(utc_offset_s) {
  if (!Number.isFinite(utc_offset_s)) {
    const name = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    return { timeZone: undefined, shift_s: 0, name: `this device's clock (${name})` };
  }
  return {
    timeZone: "UTC",
    shift_s: utc_offset_s,
    name: `the race's clock (${formatUtcOffset(utc_offset_s)})`,
  };
}

// formatShortClock on a raceClock.
export function formatRaceClock(epochSeconds, clock, referenceEpoch) {
  const shift = (epoch) => (Number.isFinite(epoch) ? epoch + clock.shift_s : epoch);
  return formatShortClock(shift(epochSeconds), clock.timeZone, shift(referenceEpoch));
}

// An instant as "08:38" when it falls on the same day as `referenceEpoch` on the zone's clock,
// else "Sun 05:00": a race plan reads in hours, with the weekday only once it rolls over.
// From Waymark's format.js. An undefined zone is the device's.
export function formatShortClock(epochSeconds, timeZone, referenceEpoch) {
  if (!Number.isFinite(epochSeconds)) return "–";
  const day = (epoch) =>
    new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(epoch * 1000));
  const sameDay = Number.isFinite(referenceEpoch) && day(epochSeconds) === day(referenceEpoch);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: sameDay ? undefined : "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(epochSeconds * 1000))
    .replace(",", "");
}
