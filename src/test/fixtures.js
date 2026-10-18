import { DEFAULT_SETTINGS, formFromSettings } from "../plan/settings.js";

// A plan as gpxz writes it, for component tests: three checkpoints, a cutoff missed at the
// second and a tight one at the third.
export const entry = (overrides = {}) => ({
  name: "Start",
  type_name: "Start",
  index: 0,
  latitude: 42.7,
  longitude: 0,
  elevation_m: 1400,
  distance_m: 0,
  elevation_gain_m: 0,
  elevation_loss_m: 0,
  duration_s_arrival: 0,
  stop_s: 0,
  duration_s_departure: 0,
  epoch_s_arrival: null,
  epoch_s_cutoff: null,
  margin_s: null,
  ...overrides,
});

export const planFixture = {
  schema_version: 2,
  course: { name: "Synthetic 6K", sha256: "a".repeat(64), distance_m: 6000 },
  model: DEFAULT_SETTINGS,
  entries: [
    // As gpxz writes a Start with a <time>: a margin of zero against itself.
    entry({ margin_s: 0 }),
    entry({
      name: "Refuge",
      type_name: "LifeBase",
      index: 150,
      distance_m: 3000,
      elevation_gain_m: 250,
      duration_s_arrival: 3600,
      stop_s: 600,
      duration_s_departure: 4200,
      margin_s: -900,
    }),
    entry({
      name: "Finish",
      type_name: "Arrival",
      index: 300,
      distance_m: 6000,
      elevation_gain_m: 260,
      duration_s_arrival: 6000,
      duration_s_departure: 6000,
      margin_s: 600,
    }),
  ],
  carry: [],
};

// The same plan with fueling on: the Start full, the Refuge (a LifeBase, full by default)
// changed to water.
export const fueledPlanFixture = {
  ...planFixture,
  model: {
    ...DEFAULT_SETTINGS,
    fueling: {
      carbs_g_per_h: 70,
      fluid_ml_per_h: 500,
      sodium_mg_per_h: 400,
      reserve_s: 1800,
      supplies: ["full", "water", "none"],
    },
  },
  carry: [
    { fluid_ml: 1250, carbs_g: 175, sodium_mg: 1000 },
    { fluid_ml: 900, carbs_g: null, sodium_mg: null },
    null,
  ],
};

export const readyState = {
  status: "ready",
  error: null,
  fileName: "synthetic.gpx",
  settings: DEFAULT_SETTINGS,
  form: formFromSettings(DEFAULT_SETTINGS),
  formErrors: {},
  plan: planFixture,
  planText: JSON.stringify(planFixture, null, 2) + "\n",
  planError: null,
  planStatus: "ready",
  notice: null,
};
