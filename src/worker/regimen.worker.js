// Regimen web worker: owns the Zig/WASM module and keeps parsing off the main thread. Every
// GPX and plan.json byte is read and written by gpxz, through zig/regimen.zig.
//
// Protocol: the page posts { id, type, payload } and gets back { id, result } or
// { id, error }. The course arrives once, transferred (loadCourse), and stays here: a change
// to the model only sends the model.

import { __zigar, buildPlan, openPlan } from "../../zig/regimen.zig";

let ready = null;

function init() {
  ready ??= __zigar.init();
  return ready;
}

// The course as it was loaded.
// why kept here: the plan's hash is of these exact bytes, and the model changes far more
// often than the course.
const course = { bytes: null };

function loadedCourse() {
  if (!course.bytes) throw new Error("No course loaded");
  return course.bytes;
}

// The plan as text and as an object. The text is plan.json byte for byte, so the download is
// exactly what gpxz wrote; the object is the same text parsed, for the table.
const planResult = (slice) => {
  const text = slice.string;
  return { text, plan: JSON.parse(text) };
};

export const handlers = {
  async loadCourse({ gpx, settings }) {
    const bytes = new Uint8Array(gpx);
    // Build before keeping: a file gpxz refuses must not replace the course already open.
    const result = planResult(await buildPlan(bytes, settings));
    course.bytes = bytes;
    return result;
  },
  async buildPlan({ settings }) {
    return planResult(await buildPlan(loadedCourse(), settings));
  },
  // A saved plan.json, read and checked against the course that is open.
  async openPlan({ plan }) {
    const slice = await openPlan(new Uint8Array(plan), loadedCourse());
    return JSON.parse(slice.string);
  },
};

export async function handleMessage({ id, type, payload }) {
  const handler = handlers[type];
  if (!handler) return { id, error: `Unknown request: ${type}` };
  try {
    await init();
    return { id, result: await handler(payload ?? {}) };
  } catch (err) {
    // Zig errors surface as JS errors named after the error set member (e.g. PlanInvalid).
    return { id, error: err?.message ?? String(err) };
  }
}

self.onmessage = async (event) => {
  self.postMessage(await handleMessage(event.data));
};
