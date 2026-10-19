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

// The margin chart's axis: the largest margin on either side of the cutoff.
// why linear, not log: a low point must mean little time to spare; a compressed scale would
// make 0h20 and 3h look alike.
export function marginScale(entries) {
  const margins = entries.map(cutoffMargin).filter((margin_s) => Number.isFinite(margin_s));
  return {
    over_s: Math.max(0, ...margins.map((margin_s) => -margin_s)),
    spare_s: Math.max(0, ...margins.map((margin_s) => margin_s)),
  };
}

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

// gpxz's checkpoint types as the runner reads them, under the name in the table.
const TYPE_NAMES = { TimeBarrier: "Time barrier", Arrival: "Finish" };

export const checkpointType = (entry) =>
  entry.type_name ? (TYPE_NAMES[entry.type_name] ?? entry.type_name) : null;

// Trail Suite's effort steps for a leg's climbing, in metres of D+ per km: 1 (easiest) to 5.
// why D+ per km: it is what the runner reads off a profile, and the plan has it per leg.
const EFFORT_GAIN_M_PER_KM = [20, 40, 60, 80];

export function effortStep(gain_m_per_km) {
  const step = EFFORT_GAIN_M_PER_KM.findIndex((limit) => gain_m_per_km < limit);
  return step === -1 ? 5 : step + 1;
}

// The stretch run before each checkpoint: its length, its climbing, the time on the move
// (from leaving the last checkpoint to arriving here) and how hard it climbs. Null for the
// first checkpoint, which nothing comes before.
export function legs(entries) {
  return entries.map((entry, index) => {
    if (index === 0) return null;
    const before = entries[index - 1];
    const distance_m = entry.distance_m - before.distance_m;
    const gain_m = entry.elevation_gain_m - before.elevation_gain_m;
    return {
      distance_m,
      gain_m,
      duration_s: entry.duration_s_arrival - before.duration_s_departure,
      effort: effortStep(distance_m > 0 ? gain_m / (distance_m / 1000) : 0),
    };
  });
}
