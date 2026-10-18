# Regimen

Plan a trail race on a course from [Waymark](https://github.com/totorototo/waymark): set your
pace model, see when you reach each checkpoint and how much room you have on its cutoff, and
export the plan as `plan.json` for Terminus and Retrace.

Everything runs in the browser. The GPX is read, and the plan computed and written, by
[gpxz](https://github.com/totorototo/gpxz) compiled to WebAssembly with Zigar. Nothing is
uploaded.

## plan.json

A plan is a standalone document for one course, separate from the GPX. It records the pace
model's inputs, the SHA-256 of the course's bytes (so a plan for another or edited file is
detected), and the arrival, stop and cutoff margin at each checkpoint. The schema is gpxz's
(`src/plan.zig`).

## Develop

Needs Node 20+ and Zig 0.17.0 on the PATH.

```bash
npm install
npm run dev
npm run test:all
npm run build && npm run check:wasm
npm run e2e
```
