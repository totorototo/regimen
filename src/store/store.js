import { create } from "zustand";

import { planHint } from "../plan/hints.js";
import {
  DEFAULT_SETTINGS,
  formFromSettings,
  planFileName,
  settingsFromForm,
} from "../plan/settings.js";
import { createWorkerClient } from "../worker/client.js";

// How long a change to the model waits for the next before the plan is recomputed: typing
// "7:30" should not parse a 3 MB course per key.
export const PLAN_DELAY_MS = 200;

const THEME_KEY = "regimen-theme";

// The variant the user last picked, else the system's, as Waymark starts from.
function initialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // Storage blocked (private mode, a sandbox): fall back to the system.
  }
  const prefersDark =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function remember(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not remembered: the next visit starts from the default.
  }
}

// `settings` with the table's supplies, when fueling is on.
const withSupplies = (settings, supplies) =>
  settings.fueling ? { ...settings, fueling: { ...settings.fueling, supplies } } : settings;

export const createStore = (getClient = createWorkerClient) => {
  let client = null;
  const worker = () => (client ??= getClient());
  // A new course drops whatever is still computing for the old one, and a newer model drops
  // an older one's plan: each result checks both before it is written.
  let generation = 0;
  let planRun = 0;
  let planTimer = null;

  return create((set, get) => {
    async function computePlan() {
      planTimer = null;
      const mine = generation;
      const run = ++planRun;
      set({ planStatus: "computing" });
      try {
        const { text, plan } = await worker().buildPlan(get().settings);
        if (mine !== generation || run !== planRun) return;
        set({ planText: text, plan, planError: null, planStatus: "ready" });
      } catch (err) {
        if (mine !== generation || run !== planRun) return;
        set({ planText: null, plan: null, planError: err.message, planStatus: "error" });
      }
    }

    function schedulePlan() {
      clearTimeout(planTimer);
      set({ planStatus: "computing" });
      planTimer = setTimeout(computePlan, PLAN_DELAY_MS);
    }

    // Puts `settings` in the form and the model, and recomputes now: a model taken from a
    // saved plan is one change, not typing. Its supplies become the table's.
    function applySettings(settings) {
      clearTimeout(planTimer);
      const supplies = settings.fueling?.supplies ?? [];
      set({ settings, supplies, form: formFromSettings(settings), formErrors: {} });
      return computePlan();
    }

    return {
      theme: initialTheme(),
      // idle → loading → ready, or error when gpxz refused the course.
      status: "idle",
      error: null,
      fileName: null,
      settings: DEFAULT_SETTINGS,
      form: formFromSettings(DEFAULT_SETTINGS),
      formErrors: {},
      // The refill the runner chose per checkpoint, or [] for the course's defaults. Kept
      // while fueling is off, so turning it back on doesn't lose the choices.
      supplies: [],
      // The course's elevation, [{ distance_m, elevation_m }], drawn behind the story.
      profile: [],
      // The race clock's offset from UTC (s), or null for the device's clock: what the
      // checkpoints' times are read on.
      utc_offset_s: null,
      // plan.json as gpxz wrote it, and parsed for the table.
      planText: null,
      plan: null,
      planError: null,
      planStatus: "idle",
      // What came of opening a saved plan: { kind: "applied" | "mismatch" | "error", ... }.
      notice: null,

      toggleTheme() {
        const theme = get().theme === "dark" ? "light" : "dark";
        remember(THEME_KEY, theme);
        set({ theme });
      },

      async openCourse(file) {
        const mine = ++generation;
        clearTimeout(planTimer);
        // Another course has other checkpoints: its refills start from its own defaults.
        const settings = withSupplies(get().settings, []);
        set({
          status: "loading",
          error: null,
          notice: null,
          fileName: file.name,
          settings,
          supplies: [],
        });
        try {
          const buffer = await file.arrayBuffer();
          const { text, plan, profile, utc_offset_s } = await worker().loadCourse(
            buffer,
            get().settings,
          );
          if (mine !== generation) return;
          set({
            status: "ready",
            profile,
            utc_offset_s,
            planText: text,
            plan,
            planError: null,
            planStatus: "ready",
          });
        } catch (err) {
          if (mine !== generation) return;
          set({ status: "error", error: err.message, plan: null, planText: null });
        }
      },

      // One field of the model form. A value that doesn't parse stays in the field, marked,
      // and the plan keeps the last valid model.
      setField(name, value) {
        const form = { ...get().form, [name]: value };
        const result = settingsFromForm(form, get().supplies);
        if (result.errors) {
          set({ form, formErrors: result.errors });
          return;
        }
        set({ form, formErrors: {}, settings: result.settings });
        if (get().status === "ready") schedulePlan();
      },

      // One checkpoint's refill, from the table: the plan's resolved supplies with that one
      // changed. A choice, not typing: recomputed now.
      setSupply(index, supply) {
        const { plan, settings } = get();
        const resolved = plan?.model.fueling?.supplies;
        if (!resolved || !settings.fueling) return undefined;
        const supplies = resolved.with(index, supply);
        clearTimeout(planTimer);
        set({ supplies, settings: withSupplies(settings, supplies) });
        return computePlan();
      },

      resetSettings() {
        if (get().status !== "ready") return undefined;
        return applySettings(DEFAULT_SETTINGS);
      },

      // A saved plan.json. Made for this course: its model replaces the form's. Made for
      // another file, or this one since edited: the person decides (applyNoticeModel).
      async openPlanFile(file) {
        if (get().status !== "ready") return;
        const mine = generation;
        try {
          const report = await worker().openPlan(await file.arrayBuffer());
          if (mine !== generation) return;
          const { model, course } = report;
          if (report.course_matches) {
            set({ notice: { kind: "applied", fileName: file.name } });
            await applySettings({ ...model });
          } else {
            set({ notice: { kind: "mismatch", fileName: file.name, model, course } });
          }
        } catch (err) {
          if (mine !== generation) return;
          const message = planHint(err.message);
          set({ notice: { kind: "error", fileName: file.name, message, detail: err.message } });
        }
      },

      async applyNoticeModel() {
        const { notice } = get();
        if (notice?.kind !== "mismatch") return;
        // Supplies for another course's checkpoints: gpxz would refuse them (SuppliesMismatch)
        // when the count differs, so the plan falls back to this course's defaults, and says so.
        const { model } = notice;
        const fits = model.fueling?.supplies.length === get().plan?.entries.length;
        const suppliesReset = model.fueling != null && !fits;
        set({ notice: { kind: "applied", fileName: notice.fileName, suppliesReset } });
        await applySettings(suppliesReset ? withSupplies(model, []) : { ...model });
      },

      dismissNotice() {
        set({ notice: null });
      },

      // plan.json for the model in the form: a change still waiting is computed first, so the
      // file is never one step behind what the person typed.
      async exportPlan() {
        if (planTimer !== null) {
          clearTimeout(planTimer);
          await computePlan();
        }
        const { planText, fileName, formErrors } = get();
        if (Object.keys(formErrors).length > 0) throw new Error("Fix the model first.");
        if (planText === null) throw new Error("No plan to export.");
        return { name: planFileName(fileName), text: planText };
      },
    };
  });
};

const useStore = createStore();

export default useStore;
