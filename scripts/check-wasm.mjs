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
assert.equal(plan.schema_version, 1);
assert.equal(plan.entries.length >= 2, true);
assert.equal(plan.model.pace_base_s_per_km, 500, "an empty settings object is gpxz's defaults");
assert(loaded.text.endsWith("}\n"), "the text is plan.json as gpxz writes it");
assert.deepEqual(JSON.parse(loaded.text), plan);
const finish = (p) => p.entries[p.entries.length - 1].duration_s_arrival;
console.log(
  `loaded ${plan.course.name}: ${plan.entries.length} checkpoints, ` +
    `finish ${(finish(plan) / 3600).toFixed(2)} h, sha256 ${plan.course.sha256.slice(0, 12)}…`,
);

const slower = { pace_base_s_per_km: 600, fatigue_coefficient: 0.004, life_base_stop_s: 600 };
const { result: rebuilt } = await call("buildPlan", { settings: slower });
assert.deepEqual(rebuilt.plan.model, slower);
assert(finish(rebuilt.plan) > finish(plan), "a slower model finishes later");
assert.equal(rebuilt.plan.course.sha256, plan.course.sha256, "same course, same hash");
console.log(`rebuilt at 10:00 /km: finish ${(finish(rebuilt.plan) / 3600).toFixed(2)} h`);

const refused = await call("buildPlan", { settings: { pace_base_s_per_km: 0 } }, true);
assert.match(refused.error, /settings invalid/i);

// The saved plan, read back against its own course, then against an edited one.
const saved = new TextEncoder().encode(rebuilt.text);
const { result: same } = await call("openPlan", { plan: buffer(saved) });
assert.equal(same.course_matches, true);
assert.deepEqual(same.model, slower);

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
