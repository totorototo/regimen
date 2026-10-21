// End-to-end check of the real boundary: runs the BUILT worker (Zig compiled to WASM by
// Zigar) in Node with a minimal `self`, and drives the protocol the page uses:
// loadCourse → buildPlan → openPlan. `npm run build` first; then
//   node scripts/check-wasm.mjs path/to/course.gpx [out.plan.json]
import assert from "node:assert/strict";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const [, , gpxPath, outPath] = process.argv;
assert(gpxPath, "usage: node scripts/check-wasm.mjs course.gpx [out.plan.json]");

const assets = fileURLToPath(new URL("../dist/assets/", import.meta.url));
const chunk = (await readdir(assets)).find((name) => /^regimen\.worker-.*\.js$/.test(name));
assert(chunk, "no built worker: run `npm run build`");

const replies = new Map();
globalThis.self = globalThis;
globalThis.postMessage = (message) => replies.get(message.id)?.(message);
await import(assets + chunk);
assert.equal(typeof globalThis.onmessage, "function", "worker did not set onmessage");

let nextId = 0;
function call(type, payload, expectError = false) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    replies.set(id, (message) => {
      if (message.error && !expectError) reject(new Error(`${type}: ${message.error}`));
      else if (!message.error && expectError) reject(new Error(`${type}: expected an error`));
      else resolve(message);
    });
    globalThis.onmessage({ data: { id, type, payload } });
  });
}

const buffer = (bytes) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const bytes = await readFile(gpxPath);

const { result: loaded } = await call("loadCourse", { gpx: buffer(bytes), settings: {} });
const { plan } = loaded;
assert.equal(plan.schema_version, 2);
assert.equal(plan.model.fueling, null, "no fueling unless asked");
assert.deepEqual(plan.carry, []);
assert.equal(plan.entries.length >= 2, true);
assert.equal(plan.model.pace_base_s_per_km, 500, "an empty settings object is gpxz's defaults");
assert(loaded.text.endsWith("}\n"), "the text is plan.json as gpxz writes it");
assert.deepEqual(JSON.parse(loaded.text), plan);
assert.equal(loaded.profile.length, 400, "the profile is 400 samples");
assert.equal(loaded.profile[0].distance_m, 0);
assert(Math.abs(loaded.profile.at(-1).distance_m - plan.course.distance_m) < 1, "to the finish");
assert(loaded.profile.every((point) => Number.isFinite(point.elevation_m)));
assert.equal(loaded.utc_offset_s, null, "a course timed in UTC says nothing of its zone");
const finish = (p) => p.entries[p.entries.length - 1].duration_s_arrival;
console.log(
  `loaded ${plan.course.name}: ${plan.entries.length} checkpoints, ` +
    `finish ${(finish(plan) / 3600).toFixed(2)} h, sha256 ${plan.course.sha256.slice(0, 12)}…`,
);

const slower = { pace_base_s_per_km: 600, fatigue_coefficient: 0.004, life_base_stop_s: 600 };
const { result: rebuilt } = await call("buildPlan", { settings: slower });
assert.deepEqual(rebuilt.plan.model, { ...slower, fueling: null });
assert(finish(rebuilt.plan) > finish(plan), "a slower model finishes later");
assert.equal(rebuilt.plan.course.sha256, plan.course.sha256, "same course, same hash");
console.log(`rebuilt at 10:00 /km: finish ${(finish(rebuilt.plan) / 3600).toFixed(2)} h`);

const refused = await call("buildPlan", { settings: { pace_base_s_per_km: 0 } }, true);
assert.match(refused.error, /settings invalid/i);

// Fueling: empty supplies come back resolved to the course's defaults; a JS array of strings
// crosses as []const Supply, and the wrong count is refused.
const rates = { carbs_g_per_h: 70, fluid_ml_per_h: 500, sodium_mg_per_h: 400, reserve_s: 1800 };
const fuelingDefault = { ...slower, fueling: { ...rates, supplies: [] } };
const { result: fueled } = await call("buildPlan", { settings: fuelingDefault });
const supplies = fueled.plan.model.fueling.supplies;
assert.equal(supplies.length, fueled.plan.entries.length);
assert.equal(supplies[0], "full", "the Start refills everything by default");
assert.equal(fueled.plan.carry.length, fueled.plan.entries.length);
assert(fueled.plan.carry[0].carbs_g > 0);
const chosen = supplies.map((supply, index) => (index === 1 ? "water" : supply));
const fuelingChosen = { ...slower, fueling: { ...rates, supplies: chosen } };
const { result: watered } = await call("buildPlan", { settings: fuelingChosen });
assert.deepEqual(watered.plan.model.fueling.supplies, chosen);
assert.equal(watered.plan.carry[1].carbs_g, null, "a water point carries fluid only");
assert(watered.plan.carry[1].fluid_ml > 0);
const short = { ...slower, fueling: { ...rates, supplies: ["full"] } };
const mismatch = await call("buildPlan", { settings: short }, true);
assert.match(mismatch.error, /supplies mismatch/i);
const tooMuch = { ...slower, fueling: { ...rates, carbs_g_per_h: 151, supplies: [] } };
assert.match((await call("buildPlan", { settings: tooMuch }, true)).error, /settings invalid/i);
console.log(
  `fueling: supplies ${chosen.join(", ")}, leave the start with ${watered.plan.carry[0].carbs_g} g`,
);
const { result: reopened } = await call("openPlan", {
  plan: buffer(new TextEncoder().encode(watered.text)),
});
assert.deepEqual(reopened.model.fueling.supplies, chosen);

// The saved plan, read back against its own course, then against an edited one.
const saved = new TextEncoder().encode(rebuilt.text);
const { result: same } = await call("openPlan", { plan: buffer(saved) });
assert.equal(same.course_matches, true);
assert.deepEqual(same.model, { ...slower, fueling: null });

const edited = Buffer.concat([bytes, Buffer.from("\n")]);
await call("loadCourse", { gpx: buffer(edited), settings: {} });
const { result: other } = await call("openPlan", { plan: buffer(saved) });
assert.equal(other.course_matches, false, "one more byte is another course");
console.log("openPlan: matches its own course, not an edited one");

const broken = new TextEncoder().encode(rebuilt.text.replace('"stop_s": 0', '"stop_s": 7'));
const invalid = await call("openPlan", { plan: buffer(broken) }, true);
assert.match(invalid.error, /plan invalid/i);
const garbage = await call("openPlan", { plan: buffer(Buffer.from("nope")) }, true);
assert(garbage.error);
console.log(`openPlan refuses: "${invalid.error}", "${garbage.error}"`);

if (outPath) await writeFile(outPath, rebuilt.text);
process.exit(0);
