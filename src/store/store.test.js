import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_SETTINGS } from "../plan/settings.js";
import { createStore, PLAN_DELAY_MS } from "./store.js";

const file = (name, text = "x") => ({
  name,
  arrayBuffer: async () => new TextEncoder().encode(text).buffer,
});

const plan = (model = DEFAULT_SETTINGS) => ({
  schema_version: 1,
  course: { name: "Test", sha256: "a".repeat(64), distance_m: 10000 },
  model,
  entries: [],
});
const built = (model) => ({ text: JSON.stringify(plan(model)), plan: plan(model) });

function fakeClient(overrides = {}) {
  return {
    loadCourse: vi.fn(async (_gpx, settings) => built(settings)),
    buildPlan: vi.fn(async (settings) => built(settings)),
    openPlan: vi.fn(async () => ({
      course_matches: true,
      course: plan().course,
      model: { pace_base_s_per_km: 400, fatigue_coefficient: 0.003, life_base_stop_s: 600 },
      entry_count: 3,
    })),
    ...overrides,
  };
}

async function ready(client = fakeClient()) {
  const store = createStore(() => client);
  await store.getState().openCourse(file("race.gpx"));
  return { store, client };
}

describe("store", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("opens a course with the form's model", async () => {
    const { store, client } = await ready();
    const state = store.getState();
    expect(state.status).toBe("ready");
    expect(state.fileName).toBe("race.gpx");
    expect(state.plan.model).toEqual(DEFAULT_SETTINGS);
    expect(client.loadCourse.mock.calls[0][1]).toEqual(DEFAULT_SETTINGS);
  });

  it("shows gpxz's refusal of a course", async () => {
    const client = fakeClient({ loadCourse: vi.fn(async () => Promise.reject(new Error("Boom"))) });
    const store = createStore(() => client);
    await store.getState().openCourse(file("bad.gpx"));
    expect(store.getState()).toMatchObject({ status: "error", error: "Boom", plan: null });
  });

  it("drops a course that finishes loading after a newer one", async () => {
    let finishFirst;
    const client = fakeClient({
      loadCourse: vi
        .fn()
        .mockImplementationOnce(() => new Promise((resolve) => (finishFirst = resolve)))
        .mockImplementationOnce(async () => built({ ...DEFAULT_SETTINGS, life_base_stop_s: 1 })),
    });
    const store = createStore(() => client);
    const first = store.getState().openCourse(file("first.gpx"));
    await vi.waitFor(() => expect(finishFirst).toBeTypeOf("function"));
    await store.getState().openCourse(file("second.gpx"));
    finishFirst(built(DEFAULT_SETTINGS));
    await first;
    expect(store.getState().fileName).toBe("second.gpx");
    expect(store.getState().plan.model.life_base_stop_s).toBe(1);
  });

  it("recomputes once after typing settles, with the last valid model", async () => {
    const { store, client } = await ready();
    store.getState().setField("pace", "7");
    store.getState().setField("pace", "7:3");
    store.getState().setField("pace", "7:30");
    expect(store.getState().planStatus).toBe("computing");
    expect(client.buildPlan).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(PLAN_DELAY_MS);
    expect(client.buildPlan).toHaveBeenCalledTimes(1);
    expect(client.buildPlan.mock.calls[0][0].pace_base_s_per_km).toBe(450);
    expect(store.getState().planStatus).toBe("ready");
  });

  it("marks a bad field and keeps the plan of the last valid model", async () => {
    const { store, client } = await ready();
    store.getState().setField("fatigue", "lots");
    await vi.advanceTimersByTimeAsync(PLAN_DELAY_MS);
    expect(client.buildPlan).not.toHaveBeenCalled();
    expect(store.getState().formErrors).toHaveProperty("fatigue");
    expect(store.getState().form.fatigue).toBe("lots");
    expect(store.getState().settings).toEqual(DEFAULT_SETTINGS);
    await expect(store.getState().exportPlan()).rejects.toThrow("Fix the model first.");
  });

  it("shows an error when gpxz refuses the model", async () => {
    const client = fakeClient({
      buildPlan: vi.fn(async () => Promise.reject(new Error("Settings invalid"))),
    });
    const { store } = await ready(client);
    store.getState().setField("pace", "9:00");
    await vi.advanceTimersByTimeAsync(PLAN_DELAY_MS);
    expect(store.getState()).toMatchObject({ planStatus: "error", planError: "Settings invalid" });
  });

  it("exports what the form says, computing a change still waiting", async () => {
    const { store, client } = await ready();
    store.getState().setField("lifeBaseStopMin", "15");
    const { name, text } = await store.getState().exportPlan();
    expect(client.buildPlan).toHaveBeenCalledTimes(1);
    expect(name).toBe("race.plan.json");
    expect(JSON.parse(text).model.life_base_stop_s).toBe(900);
  });

  it("resets to the defaults", async () => {
    const { store } = await ready();
    store.getState().setField("pace", "6:00");
    await store.getState().resetSettings();
    expect(store.getState().form.pace).toBe("8:20");
    expect(store.getState().plan.model).toEqual(DEFAULT_SETTINGS);
  });

  it("applies the model of a plan made for this course", async () => {
    const { store } = await ready();
    await store.getState().openPlanFile(file("race.plan.json"));
    const state = store.getState();
    expect(state.notice).toEqual({ kind: "applied", fileName: "race.plan.json" });
    expect(state.form).toEqual({ pace: "6:40", fatigue: "0.003", lifeBaseStopMin: "10" });
    expect(state.plan.model.pace_base_s_per_km).toBe(400);
  });

  it("asks before using the model of a plan made for another course", async () => {
    const report = await fakeClient().openPlan();
    const client = fakeClient({
      openPlan: vi.fn(async () => ({ ...report, course_matches: false })),
    });
    const { store } = await ready(client);
    await store.getState().openPlanFile(file("other.plan.json"));
    expect(store.getState().notice.kind).toBe("mismatch");
    expect(store.getState().settings).toEqual(DEFAULT_SETTINGS);

    await store.getState().applyNoticeModel();
    expect(store.getState().notice.kind).toBe("applied");
    expect(store.getState().settings.pace_base_s_per_km).toBe(400);
    store.getState().dismissNotice();
    expect(store.getState().notice).toBeNull();
  });

  it("explains a plan gpxz refused", async () => {
    const client = fakeClient({
      openPlan: vi.fn(async () => Promise.reject(new Error("Plan invalid"))),
    });
    const { store } = await ready(client);
    await store.getState().openPlanFile(file("broken.plan.json"));
    expect(store.getState().notice).toMatchObject({ kind: "error", detail: "Plan invalid" });
    expect(store.getState().notice.message).toMatch(/don't add up/);
  });

  it("opens no plan before a course", async () => {
    const client = fakeClient();
    const store = createStore(() => client);
    await store.getState().openPlanFile(file("race.plan.json"));
    expect(client.openPlan).not.toHaveBeenCalled();
  });

  it("flips the theme and remembers it", () => {
    const store = createStore(() => fakeClient());
    const before = store.getState().theme;
    store.getState().toggleTheme();
    expect(store.getState().theme).not.toBe(before);
    expect(localStorage.getItem("regimen-theme")).toBe(store.getState().theme);
  });
});
