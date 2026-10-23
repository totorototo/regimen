# regimen: project rules

Web app that plans a trail race on a course from Waymark: the runner sets the pace model,
sees each checkpoint's arrival, stop and cutoff margin, and exports `plan.json`. Fourth app
after Terminus (run), Retrace (debrief) and Waymark (course). React 19 + styled-components +
zustand, Vite 8, Vitest, Playwright, Zig 0.17 via Zigar.

## The plan is gpxz's

- The course is the extended GPX (facts: checkpoints, cutoffs, `<stopDuration>`). The plan is
  `plan.json` (strategy for that course), defined, computed, written and read by gpxz
  (`src/plan.zig` there). Several plans per course are fine.
- No JavaScript reads GPX or builds a plan. The page hands bytes to the worker and gets back
  plan.json's text, which it downloads as is and parses only to draw the story, and the
  course's elevation profile (`courseProfile`, 400 samples), drawn behind it.
- A plan names its course by the SHA-256 of the GPX's bytes. Opening a plan for another file
  (or this one edited) is shown, never silently applied: the person chooses.
- Regimen edits the model only (`pace_base_s_per_km`, `fatigue_coefficient`,
  `life_base_stop_s`, and `fueling`), never the entries: gpxz computes those. plan.json is v2
  (gpxz reads v1, writes v2 only).
- Fueling is race strategy, so it lives in plan.json and never in the GPX. `fueling: null` is
  off (the default). On, it has hourly carbs, fluid, sodium, a reserve, and `supplies`, one
  per entry (`none` / `water` / `full`). The page sends `supplies: []` for the course's
  defaults and draws the Refill selects from the resolved `model.fueling.supplies` that gpxz
  sends back; `carry` (what to leave each refill with) is gpxz's, never computed here. The
  page only mirrors `supplies_default` (Start and LifeBase full) to mark a changed refill.
- Per-checkpoint stops and per-segment pace targets need gpxz (plan_compute's inputs and a
  schema_version bump) first.

## Zig side (`zig/`)

- Don't vendor library code. gpxz is a dependency pinned in `build.zig.zon`.
- `regimen.zig` is a thin boundary: bytes in, plan.json's bytes or JSON out (or the flat
  `[]f64` profile). Exports are camelCase (`buildPlan`, `openPlan`, `courseProfile`);
  internal functions are snake_case and take a scratch and an output allocator. TIGER_STYLE as in gpxz: assertions, functions of at most 70 lines,
  100 columns, tests for everything, `zig fmt`.
- The WASM build is ReleaseSmall, where a failed assert is undefined behaviour: anything that
  comes from the page (settings, files) is checked with errors. The settings bounds live in
  `regimen.zig` and are mirrored in `src/plan/settings.js`; keep them in step.
- Zigar converts a JS array of strings to `[]const Supply` and `null` to an optional struct,
  so `PlanSettings.fueling` crosses as a plain object (checked in `check-wasm.mjs`).
- Zigar builds the WASM module with its own build.zig, using `build.extra.zig` for imports
  (`ignoreBuildFile: true`). `zig/build.zig` is only for `zig build test`.
- Zig is not on every PATH: Zigar needs `zig` to run `vite build`.

## JS side

- Only the worker imports `.zig` files. Unit tests mock them; vitest.config.js stubs `.zig`
  loads so Vitest never compiles Zig. The real boundary is `scripts/check-wasm.mjs`
  (`npm run build`, then `npm run check:wasm`), and `e2e/` (`npm run e2e`) runs the built
  app in Chromium.
- The store recomputes the plan 200 ms after the last valid change to the model; a field that
  doesn't parse is marked and the plan keeps the last valid model. Export computes a change
  still waiting first, so the file matches the form.
- The first checkpoint's margin is not shown: its `<time>` is the start, not a cutoff.
- The page is Terminus's and Retrace's story: one 46rem column of sections in
  `src/components/story/` (the section list in `storySections`), the course's elevation
  rotated behind it, a dot nav. Controls are Terminus's section commands (`actionButton` in
  controls.js): the model is a column of stepper rows right under the verdict (`StoryModel`:
  − value +, the value read only; `stepText` in settings.js steps, snaps and bounds it), and
  the story ends on StoryEnd's column (export, files, theme, reset). No sidebar, no floating
  panel.
- No map, PWA or agent tools yet (Waymark has all three, to copy when they're wanted).
- Design system (Trail Suite): tokens come from `@totorototo/trail-tokens`;
  `src/theme/Theme.js` only re-exports it. Never edit token values here. Shared control
  styles are fragments in `src/theme/controls.js`. Component styles go in `*.style.js` next
  to the component.
- Spacing (padding, margin, gap, offsets) is the design system's 4px grid: `var(--space-4)`,
  never a rem or px literal; a value off the grid rounds up. Fluid spacing shared across
  screens is a layout token (`--gutter`, `--start-gap`, `--section-block`, `--stat-gap`).

## Data

- Never commit a director's course or a runner's plan. `.gitignore` blocks `*.gpx` (except
  the synthetic fixture in `zig/testdata/`) and `*.plan.json`.
