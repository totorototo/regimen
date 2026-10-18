import { formatLitres, formatMargin } from "../utils/format.js";

// Trail Suite's margin vocabulary, the same in every app: OK with an hour or more to spare,
// Tight under an hour, Over past the cutoff.
export const MARGIN_TIGHT_S = 60 * 60;

export const TIER_WORDS = { ok: "OK", tight: "Tight", over: "Over" };

export function marginTier(margin_s) {
  if (margin_s === null || !Number.isFinite(margin_s)) return null;
  if (margin_s < 0) return "over";
  if (margin_s < MARGIN_TIGHT_S) return "tight";
  return "ok";
}

// The first checkpoint's <time> is the start, not a cutoff (gpxz's PlanEntry), so its margin
// is always zero and says nothing.
export const cutoffMargin = (entry, index) => (index === 0 ? null : entry.margin_s);

// How the plan stands against its cutoffs, in one line: the worst news first.
// { tier, text } with tier null when the course has no cutoffs.
export function verdict(entries) {
  const cutoffs = entries
    .map((entry, index) => ({ name: entry.name, margin_s: cutoffMargin(entry, index) }))
    .filter((cutoff) => cutoff.margin_s !== null);
  if (cutoffs.length === 0) return { tier: null, text: "No cutoffs on this course." };

  const over = cutoffs.filter((cutoff) => cutoff.margin_s < 0);
  const held = cutoffs.filter((cutoff) => cutoff.margin_s >= 0);
  const tightest = held.reduce((a, b) => (b.margin_s < a.margin_s ? b : a), held[0]);
  const rest = tightest
    ? ` Tightest of the rest: ${tightest.name}, ${formatMargin(tightest.margin_s)}.`
    : "";

  if (over.length === 1) {
    const [first] = over;
    return {
      tier: "over",
      text: `${first.name} is past its cutoff by ${formatMargin(-first.margin_s)}.${rest}`,
    };
  }
  if (over.length > 1) {
    const [first] = over;
    return {
      tier: "over",
      text: `${over.length} cutoffs missed, the first at ${first.name} (${formatMargin(first.margin_s)}).`,
    };
  }
  return {
    tier: marginTier(tightest.margin_s),
    text: `Every cutoff holds. Tightest: ${tightest.name}, ${formatMargin(tightest.margin_s)}.`,
  };
}

// What the race takes at the hourly targets, start to finish (no reserve: that is carried,
// not eaten). Rounded up, as gpxz's carry.
export function fuelingTotals(plan) {
  const fueling = plan?.model.fueling;
  if (!fueling) return null;
  const finish = plan.entries[plan.entries.length - 1];
  const hours = finish.duration_s_arrival / 3600;
  return {
    carbs: `${Math.ceil(fueling.carbs_g_per_h * hours)} g`,
    fluid: formatLitres(Math.ceil(fueling.fluid_ml_per_h * hours)),
    sodium: `${Math.ceil((fueling.sodium_mg_per_h * hours) / 100) / 10} g`,
  };
}

// gpxz's checkpoint types as the runner reads them.
const TYPE_NAMES = { TimeBarrier: "Time barrier", Arrival: "Finish" };

// "Time barrier · 21.9 km · D+ 2150 m": what a row says under the checkpoint's name.
export function checkpointMeta(entry) {
  const parts = [];
  if (entry.type_name) parts.push(TYPE_NAMES[entry.type_name] ?? entry.type_name);
  parts.push(`${(entry.distance_m / 1000).toFixed(1)} km`);
  if (entry.elevation_gain_m > 0) {
    parts.push(`D+ ${Math.round(entry.elevation_gain_m)} m`);
  }
  return parts.join(" · ");
}
