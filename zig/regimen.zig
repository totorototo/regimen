//! regimen: the WebAssembly boundary. JavaScript hands over the raw bytes of an extended GPX
//! (from waymark) and the pace model's inputs, and gets `plan.json` back. All the work lives in
//! gpxz, reading and writing alike:
//!
//! - `buildPlan`: the plan for a course and a model, as the exact bytes of `plan.json`.
//! - `openPlan`: a saved `plan.json` read and validated, with whether it was made for the
//!   course that is open.
//! - `courseProfile`: the course's elevation at evenly spaced distances, for the line drawn
//!   behind the page.
//! - `courseUtcOffset`: the race clock's offset from UTC, for the times the page writes.
//! - `slowestPace`: the slowest flat pace that still makes every cutoff, for the model's
//!   fatigue and stops.
//!
//! JSON rather than Zig structs crosses the boundary on purpose: a plan is a tree of optional
//! fields and slices, which Zigar would expose as proxies over WASM memory that the caller
//! must free. A JSON string is copied out once, and the worker posts a plain object.

const std = @import("std");
const builtin = @import("builtin");
const assert = std.debug.assert;
const gpxz = @import("gpxz");

/// Scratch memory for parsing. The allocator Zigar passes in is only used for the returned
/// JSON, so JavaScript owns exactly one allocation per call.
const scratch_allocator = if (builtin.target.cpu.arch.isWasm())
    std.heap.wasm_allocator
else
    std.heap.smp_allocator;

/// Multi-day ultra GPX files are a few MiB; gpxz's parse refuses more than this.
pub const gpx_bytes_max = gpxz.gpx.bytes_max;

const Supply = gpxz.fueling.Supply;

/// The pace model's inputs, as JavaScript passes them. Missing fields take gpxz's defaults.
pub const PlanSettings = struct {
    pace_base_s_per_km: f64 = gpxz.pace_model.pace_base_s_per_km_default,
    fatigue_coefficient: f64 = gpxz.pace_model.fatigue_coefficient_default,
    life_base_stop_s: u32 = gpxz.pace_model.life_base_stop_s_default,
    /// Null when the runner plans no fueling.
    fueling: ?FuelingSettings = null,
};

/// The runner's fueling, as JavaScript passes it: gpxz's `Fueling` with defaults, and
/// `supplies` either one per checkpoint or empty, which means gpxz's defaults for the course
/// (`supplies_default`). The page reads the resolved supplies back from the plan.
pub const FuelingSettings = struct {
    carbs_g_per_h: f64 = 0,
    fluid_ml_per_h: f64 = 0,
    sodium_mg_per_h: f64 = 0,
    reserve_s: u32 = 0,
    supplies: []const Supply = &.{},
};

/// The bounds a setting must fall in: gpxz's (`Settings.validate`), except a stricter
/// minimum pace. Regimen plans races, and nobody races under 2:00/km.
pub const pace_base_s_per_km_min = 120.0;
pub const pace_base_s_per_km_max = gpxz.pace_model.pace_base_s_per_km_max;
pub const fatigue_coefficient_max = gpxz.pace_model.fatigue_coefficient_max;
pub const life_base_stop_s_max = gpxz.pace_model.life_base_stop_s_max;
/// Fueling's form bounds, a first guess: gpxz only needs finite, non-negative rates. Past
/// them a value is a typo (1500 g/h for 150), not a plan.
pub const carbs_g_per_h_max = 150.0;
pub const fluid_ml_per_h_max = 1500.0;
pub const sodium_mg_per_h_max = 3000.0;
pub const reserve_s_max: u32 = 180 * 60;

// Exports (camelCase: these names are the JavaScript API)

/// The plan for the course in `gpx_bytes` with `settings`, as the bytes of `plan.json`.
pub fn buildPlan(
    allocator: std.mem.Allocator,
    gpx_bytes: []const u8,
    settings: PlanSettings,
) ![]u8 {
    return plan_build(scratch_allocator, allocator, gpx_bytes, settings);
}

/// `plan_bytes` read as `plan.json`, as JSON: its course and model, and whether its course
/// is the one in `gpx_bytes` (see `OpenReport`).
pub fn openPlan(
    allocator: std.mem.Allocator,
    plan_bytes: []const u8,
    gpx_bytes: []const u8,
) ![]u8 {
    return plan_open(scratch_allocator, allocator, plan_bytes, gpx_bytes);
}

/// The course's elevation sampled at `profile_samples` evenly spaced distances, start to
/// finish, as [distance_m, elevation_m, distance_m, elevation_m, ...].
/// why a flat []f64: Zigar hands it over as one Float64Array, not a proxy per point.
pub fn courseProfile(allocator: std.mem.Allocator, gpx_bytes: []const u8) ![]f64 {
    return profile_build(scratch_allocator, allocator, gpx_bytes);
}

/// The race clock's offset from UTC in seconds: that of the first waypoint's `<time>`, which
/// Waymark writes on the race's zone. Null without one, or for one in UTC.
/// why null for UTC: a `Z` is also what other tools write whatever the race's zone, so it says
/// nothing; the page then reads times on the device's clock, and says so.
pub fn courseUtcOffset(gpx_bytes: []const u8) !?i32 {
    return utc_offset_read(scratch_allocator, gpx_bytes);
}

/// The slowest flat pace (s/km, whole seconds) at which every cutoff holds, the rest of
/// `settings` kept: what the runner can afford, in place of stepping until nothing is Over.
/// Null when the course has no cutoff, or when even the fastest pace misses one (a stop
/// alone runs past it). Fueling doesn't move the times, so it's ignored.
pub fn slowestPace(gpx_bytes: []const u8, settings: PlanSettings) !?f64 {
    return pace_slowest(scratch_allocator, gpx_bytes, settings);
}

// Implementation (snake_case, testable with any pair of allocators)

fn pace_slowest(scratch: std.mem.Allocator, gpx_bytes: []const u8, settings: PlanSettings) !?f64 {
    if (gpx_bytes.len > gpx_bytes_max) return error.FileTooLarge;
    var model = try settings_check(&settings);
    var data = try gpxz.parse(scratch, gpx_bytes, &model);
    defer data.deinit(scratch);
    const entries = data.plan orelse return error.CheckpointsTooFew;
    if (entries.len < 2) return error.CheckpointsTooFew;
    if (!cutoffs_any(entries)) return null;

    // why bisect: a slower pace arrives later at every checkpoint, so the cutoffs hold up to
    // one pace and miss past it. The parse is done once; each step is one pass of the model.
    var fast: f64 = pace_base_s_per_km_min;
    var slow: f64 = pace_base_s_per_km_max;
    model.pace_base_s_per_km = fast;
    if (!try cutoffs_hold(scratch, &data, &model)) return null;
    model.pace_base_s_per_km = slow;
    if (try cutoffs_hold(scratch, &data, &model)) return slow;
    // Invariant: `fast` holds, `slow` misses. Whole seconds: 12 steps over the bounds.
    while (slow - fast > 1) {
        const middle = @floor((fast + slow) / 2);
        model.pace_base_s_per_km = middle;
        if (try cutoffs_hold(scratch, &data, &model)) fast = middle else slow = middle;
    }
    assert(fast >= pace_base_s_per_km_min and fast < pace_base_s_per_km_max);
    return fast;
}

/// Whether a checkpoint past the first has a cutoff: the first's `<time>` is the start.
fn cutoffs_any(entries: []const gpxz.PlanEntry) bool {
    for (entries[1..]) |*entry| {
        if (entry.margin_s != null) return true;
    }
    return false;
}

/// Whether the plan at `model` reaches every checkpoint by its cutoff.
fn cutoffs_hold(
    scratch: std.mem.Allocator,
    data: *const gpxz.GPXData,
    model: *const gpxz.Settings,
) !bool {
    const entries = (try gpxz.calibration.plan_compute(
        scratch,
        &data.trace,
        data.waypoints,
        model,
    )) orelse return error.CheckpointsTooFew;
    defer scratch.free(entries);
    if (entries.len < 2) return error.CheckpointsTooFew;
    for (entries[1..]) |*entry| {
        if (entry.margin_s) |margin_s| if (margin_s < 0) return false;
    }
    return true;
}

fn utc_offset_read(scratch: std.mem.Allocator, gpx_bytes: []const u8) !?i32 {
    if (gpx_bytes.len > gpx_bytes_max) return error.FileTooLarge;
    // The waypoints only: the trace isn't needed for a clock.
    const waypoints = try gpxz.gpx.waypoints_read(scratch, gpx_bytes);
    defer gpxz.gpx.waypoints_free(scratch, waypoints);
    for (waypoints) |*waypoint| {
        if (waypoint.epoch_s == null) continue;
        assert(@abs(waypoint.utc_offset_s) <= gpxz.time.utc_offset_s_max);
        return if (waypoint.utc_offset_s == 0) null else waypoint.utc_offset_s;
    }
    return null;
}

/// Enough to draw a 1000-unit tall line without visible steps; a fixed count keeps the
/// transfer small whatever the file's resolution.
pub const profile_samples = 400;

fn profile_build(
    scratch: std.mem.Allocator,
    output: std.mem.Allocator,
    gpx_bytes: []const u8,
) ![]f64 {
    if (gpx_bytes.len > gpx_bytes_max) return error.FileTooLarge;
    // The profile is the course's, not the model's: gpxz's default pace is enough to parse.
    const settings: gpxz.Settings = .{};
    var data = try gpxz.parse(scratch, gpx_bytes, &settings);
    defer data.deinit(scratch);
    const trace = &data.trace;
    if (trace.points.len < 2) return error.CheckpointsTooFew;
    assert(trace.distances_m_cumulative.len == trace.points.len);

    const profile = try output.alloc(f64, profile_samples * 2);
    errdefer output.free(profile);
    const step_m = trace.distance_m / @as(f64, profile_samples - 1);
    for (0..profile_samples) |sample| {
        const distance_m = step_m * @as(f64, @floatFromInt(sample));
        const index = trace.index_at_distance(distance_m);
        profile[sample * 2] = distance_m;
        profile[sample * 2 + 1] = trace.points[index][2];
    }
    assert(profile[0] == 0);
    return profile;
}

fn settings_check(settings: *const PlanSettings) error{SettingsInvalid}!gpxz.Settings {
    // Regimen's own floor; NaN fails it too. gpxz checks the rest.
    if (!(settings.pace_base_s_per_km >= pace_base_s_per_km_min)) return error.SettingsInvalid;
    const result: gpxz.Settings = .{
        .pace_base_s_per_km = settings.pace_base_s_per_km,
        .fatigue_coefficient = settings.fatigue_coefficient,
        .life_base_stop_s = settings.life_base_stop_s,
    };
    try result.validate();
    result.assert_valid();
    return result;
}

fn fueling_check(fueling: *const FuelingSettings) error{SettingsInvalid}!void {
    const rates = [_]struct { f64, f64 }{
        .{ fueling.carbs_g_per_h, carbs_g_per_h_max },
        .{ fueling.fluid_ml_per_h, fluid_ml_per_h_max },
        .{ fueling.sodium_mg_per_h, sodium_mg_per_h_max },
    };
    // Written so NaN fails: every comparison with it is false.
    for (rates) |rate| {
        if (!(rate[0] >= 0 and rate[0] <= rate[1])) return error.SettingsInvalid;
    }
    if (fueling.reserve_s > reserve_s_max) return error.SettingsInvalid;
}

/// The fueling for `entries` and the carry it gives, allocated in `arena`. Empty supplies
/// are the course's defaults; any other count than one per entry is the page's mistake (a
/// plan for another course, or a stale form).
fn fuel_plan_compute(
    arena: std.mem.Allocator,
    settings: *const FuelingSettings,
    entries: []const gpxz.PlanEntry,
) !gpxz.fueling.FuelPlan {
    assert(entries.len >= 2);
    const supplies: []const Supply = if (settings.supplies.len == 0) supplies: {
        const supplies = try arena.alloc(Supply, entries.len);
        gpxz.fueling.supplies_default(entries, supplies);
        break :supplies supplies;
    } else supplies: {
        if (settings.supplies.len != entries.len) return error.SuppliesMismatch;
        break :supplies settings.supplies;
    };
    const fueling: gpxz.fueling.Fueling = .{
        .carbs_g_per_h = settings.carbs_g_per_h,
        .fluid_ml_per_h = settings.fluid_ml_per_h,
        .sodium_mg_per_h = settings.sodium_mg_per_h,
        .reserve_s = settings.reserve_s,
        .supplies = supplies,
    };
    assert(gpxz.fueling.fueling_valid(&fueling, entries.len));

    const times = try arena.alloc(gpxz.fueling.Times, entries.len);
    gpxz.fueling.times_from_entries(entries, times);
    const carry = try arena.alloc(?gpxz.fueling.Carry, entries.len);
    gpxz.fueling.carry_compute(times, &fueling, carry);
    return .{ .fueling = fueling, .carry = carry };
}

fn plan_build(
    scratch: std.mem.Allocator,
    output: std.mem.Allocator,
    gpx_bytes: []const u8,
    settings: PlanSettings,
) ![]u8 {
    if (gpx_bytes.len > gpx_bytes_max) return error.FileTooLarge;
    const gpxz_settings = try settings_check(&settings);
    if (settings.fueling) |*fueling| try fueling_check(fueling);
    var data = try gpxz.parse(scratch, gpx_bytes, &gpxz_settings);
    defer data.deinit(scratch);
    // A plan needs a Start and somewhere to go: a file without two typed checkpoints is a
    // route waymark has not been through yet.
    const entries = data.plan orelse return error.CheckpointsTooFew;
    if (entries.len < 2) return error.CheckpointsTooFew;

    var arena: std.heap.ArenaAllocator = .init(scratch);
    defer arena.deinit();
    const fuel_plan: ?gpxz.fueling.FuelPlan = if (settings.fueling) |*fueling|
        try fuel_plan_compute(arena.allocator(), fueling, entries)
    else
        null;
    const plan = gpxz.plan_build(
        gpx_bytes,
        data.metadata.name,
        data.trace.distance_m,
        entries,
        &gpxz_settings,
        if (fuel_plan) |*fuel| fuel else null,
    );
    var out: std.Io.Writer.Allocating = .init(output);
    errdefer out.deinit();
    try gpxz.plan_write(&out.writer, &plan);
    const json = try out.toOwnedSlice();
    assert(json.len > 0 and json[json.len - 1] == '\n');
    return json;
}

/// What the page needs from a saved plan: the model to put back in the form (fueling and its
/// supplies included), and whether the plan is for this course. The entries and the carry stay
/// behind: the page recomputes them from the model, so what it shows is always gpxz's plan for
/// the open file.
const OpenReport = struct {
    course_matches: bool,
    course: gpxz.plan.Course,
    model: gpxz.plan.Model,
    entry_count: u64,
};

fn plan_open(
    scratch: std.mem.Allocator,
    output: std.mem.Allocator,
    plan_bytes: []const u8,
    gpx_bytes: []const u8,
) ![]u8 {
    if (gpx_bytes.len > gpx_bytes_max) return error.FileTooLarge;
    const parsed = try gpxz.plan_read(scratch, plan_bytes);
    defer parsed.deinit();
    const plan = &parsed.value;
    assert(gpxz.plan.plan_valid(plan));

    const report: OpenReport = .{
        .course_matches = gpxz.plan.course_matches(plan, gpx_bytes),
        .course = plan.course,
        .model = plan.model,
        .entry_count = plan.entries.len,
    };
    var out: std.Io.Writer.Allocating = .init(output);
    errdefer out.deinit();
    try std.json.Stringify.value(report, .{}, &out.writer);
    const json = try out.toOwnedSlice();
    assert(json.len > 0);
    return json;
}

// Tests

const testing = std.testing;
const fixture_gpx = @embedFile("fixture.gpx");

fn build_test(settings: PlanSettings) ![]u8 {
    return plan_build(testing.allocator, testing.allocator, fixture_gpx, settings);
}

test "buildPlan: the fixture's three checkpoints, for its own bytes" {
    const json = try build_test(.{ .pace_base_s_per_km = 420, .life_base_stop_s = 600 });
    defer testing.allocator.free(json);
    const parsed = try gpxz.plan_read(testing.allocator, json);
    defer parsed.deinit();
    const plan = &parsed.value;

    try testing.expectEqualStrings("Synthetic 6K", plan.course.name.?);
    try testing.expect(gpxz.plan.course_matches(plan, fixture_gpx));
    try testing.expectEqual(@as(f64, 420), plan.model.pace_base_s_per_km);
    try testing.expectEqual(@as(u32, 600), plan.model.life_base_stop_s);
    try testing.expectEqual(@as(usize, 3), plan.entries.len);
    try testing.expectEqualStrings("Start", plan.entries[0].name);
    try testing.expectEqualStrings("Refuge", plan.entries[1].name);
    try testing.expectEqualStrings("Finish", plan.entries[2].name);
    // The fixture's Start has a time and the Refuge a cutoff, so the margin is known.
    try testing.expect(plan.entries[1].margin_s != null);
}

test "buildPlan: a slower pace arrives later" {
    const fast = try build_test(.{ .pace_base_s_per_km = 300 });
    defer testing.allocator.free(fast);
    const slow = try build_test(.{ .pace_base_s_per_km = 600 });
    defer testing.allocator.free(slow);
    const parsed_fast = try gpxz.plan_read(testing.allocator, fast);
    defer parsed_fast.deinit();
    const parsed_slow = try gpxz.plan_read(testing.allocator, slow);
    defer parsed_slow.deinit();
    const finish_fast = parsed_fast.value.entries[2].duration_s_arrival;
    const finish_slow = parsed_slow.value.entries[2].duration_s_arrival;
    try testing.expect(finish_slow > finish_fast);
}

test "buildPlan: settings at their bounds pass, one step past them fail" {
    const valid = [_]PlanSettings{
        .{ .pace_base_s_per_km = pace_base_s_per_km_min },
        .{ .pace_base_s_per_km = pace_base_s_per_km_max },
        .{ .fatigue_coefficient = 0 },
        .{ .fatigue_coefficient = fatigue_coefficient_max },
        .{ .life_base_stop_s = 0 },
        .{ .life_base_stop_s = life_base_stop_s_max },
    };
    for (valid) |settings| testing.allocator.free(try build_test(settings));

    const invalid = [_]PlanSettings{
        .{ .pace_base_s_per_km = pace_base_s_per_km_min - 1 },
        .{ .pace_base_s_per_km = pace_base_s_per_km_max + 1 },
        .{ .pace_base_s_per_km = std.math.nan(f64) },
        .{ .pace_base_s_per_km = std.math.inf(f64) },
        .{ .fatigue_coefficient = -0.001 },
        .{ .fatigue_coefficient = fatigue_coefficient_max + 0.001 },
        .{ .fatigue_coefficient = std.math.nan(f64) },
        .{ .life_base_stop_s = life_base_stop_s_max + 1 },
    };
    for (invalid) |settings| {
        try testing.expectError(error.SettingsInvalid, build_test(settings));
    }
}

const fueling_test: FuelingSettings = .{
    .carbs_g_per_h = 70,
    .fluid_ml_per_h = 500,
    .sodium_mg_per_h = 400,
    .reserve_s = 1800,
};

test "buildPlan: fueling off writes v2 with no fueling and no carry" {
    const json = try build_test(.{});
    defer testing.allocator.free(json);
    const parsed = try gpxz.plan_read(testing.allocator, json);
    defer parsed.deinit();
    try testing.expectEqual(gpxz.plan.schema_version, parsed.value.schema_version);
    try testing.expect(parsed.value.model.fueling == null);
    try testing.expectEqual(@as(usize, 0), parsed.value.carry.len);
}

test "buildPlan: empty supplies are the course's defaults, with a carry per entry" {
    const json = try build_test(.{ .fueling = fueling_test });
    defer testing.allocator.free(json);
    const parsed = try gpxz.plan_read(testing.allocator, json);
    defer parsed.deinit();
    const plan = &parsed.value;
    const fueling = plan.model.fueling.?;

    try testing.expectEqual(@as(f64, 70), fueling.carbs_g_per_h);
    try testing.expectEqual(@as(u32, 1800), fueling.reserve_s);
    // The fixture's Start is full; its Refuge is a TimeBarrier, which refills nothing.
    try testing.expectEqualSlices(Supply, &.{ .full, .none, .none }, fueling.supplies);
    try testing.expectEqual(@as(usize, 3), plan.carry.len);
    try testing.expect(plan.carry[1] == null and plan.carry[2] == null);
    // From the Start to the Finish (no refill on the way), plus the reserve, rounded up.
    const leg_s = plan.entries[2].duration_s_arrival - plan.entries[0].duration_s_departure;
    const carry = plan.carry[0].?;
    try testing.expectEqual(@ceil(500 * (leg_s + 1800) / 3600), carry.fluid_ml);
    try testing.expectEqual(@ceil(70 * (leg_s + 1800) / 3600), carry.carbs_g.?);
    try testing.expectEqual(@ceil(400 * (leg_s + 1800) / 3600), carry.sodium_mg.?);
}

test "buildPlan: chosen supplies are kept, a water point carries fluid only" {
    var fueling = fueling_test;
    fueling.supplies = &.{ .full, .water, .none };
    const json = try build_test(.{ .fueling = fueling });
    defer testing.allocator.free(json);
    const parsed = try gpxz.plan_read(testing.allocator, json);
    defer parsed.deinit();
    const plan = &parsed.value;

    try testing.expectEqualSlices(Supply, fueling.supplies, plan.model.fueling.?.supplies);
    const water = plan.carry[1].?;
    try testing.expect(water.fluid_ml > 0);
    try testing.expect(water.carbs_g == null and water.sodium_mg == null);
    // The Refuge refills no food: the Start's carbs run to the Finish.
    const to_finish_s = plan.entries[2].duration_s_arrival - plan.entries[0].duration_s_departure;
    try testing.expectEqual(@ceil(70 * (to_finish_s + 1800) / 3600), plan.carry[0].?.carbs_g.?);
}

test "buildPlan: supplies other than one per checkpoint are a mismatch" {
    const counts = [_][]const Supply{
        &.{.full},
        &.{ .full, .none },
        &.{ .full, .none, .none, .full },
    };
    for (counts) |supplies| {
        var fueling = fueling_test;
        fueling.supplies = supplies;
        try testing.expectError(error.SuppliesMismatch, build_test(.{ .fueling = fueling }));
    }
}

test "buildPlan: fueling at its bounds passes, one step past them fails" {
    const valid = [_]FuelingSettings{
        .{},
        .{ .carbs_g_per_h = carbs_g_per_h_max },
        .{ .fluid_ml_per_h = fluid_ml_per_h_max },
        .{ .sodium_mg_per_h = sodium_mg_per_h_max },
        .{ .reserve_s = reserve_s_max },
    };
    for (valid) |fueling| testing.allocator.free(try build_test(.{ .fueling = fueling }));

    const invalid = [_]FuelingSettings{
        .{ .carbs_g_per_h = -1 },
        .{ .carbs_g_per_h = carbs_g_per_h_max + 1 },
        .{ .carbs_g_per_h = std.math.nan(f64) },
        .{ .fluid_ml_per_h = -1 },
        .{ .fluid_ml_per_h = fluid_ml_per_h_max + 1 },
        .{ .fluid_ml_per_h = std.math.inf(f64) },
        .{ .sodium_mg_per_h = -1 },
        .{ .sodium_mg_per_h = sodium_mg_per_h_max + 1 },
        .{ .reserve_s = reserve_s_max + 1 },
    };
    for (invalid) |fueling| {
        try testing.expectError(error.SettingsInvalid, build_test(.{ .fueling = fueling }));
    }
}

test "buildPlan: a route with fewer than two checkpoints has no plan" {
    const bare =
        \\<gpx><trk><trkseg>
        \\<trkpt lat="45.0000" lon="6.0000"><ele>1000</ele></trkpt>
        \\<trkpt lat="45.0010" lon="6.0000"><ele>1050</ele></trkpt>
        \\<trkpt lat="45.0020" lon="6.0000"><ele>1020</ele></trkpt>
        \\</trkseg></trk></gpx>
    ;
    try testing.expectError(
        error.CheckpointsTooFew,
        plan_build(testing.allocator, testing.allocator, bare, .{}),
    );
}

test "buildPlan: a malformed file is gpxz's parse error" {
    const bytes = "<gpx><trk><trkseg><trkpt lat=\"1\" lon=\"1\"></trkpt></trkseg></trk></gpx>";
    try testing.expectError(
        error.ElevationMissing,
        plan_build(testing.allocator, testing.allocator, bytes, .{}),
    );
}

fn open_test(plan_bytes: []const u8, gpx_bytes: []const u8) !std.json.Parsed(OpenReport) {
    const json = try plan_open(testing.allocator, testing.allocator, plan_bytes, gpx_bytes);
    defer testing.allocator.free(json);
    return std.json.parseFromSlice(OpenReport, testing.allocator, json, .{
        .allocate = .alloc_always,
    });
}

test "openPlan: its own course matches, any other bytes do not" {
    const json = try build_test(.{ .fatigue_coefficient = 0.004 });
    defer testing.allocator.free(json);

    const same = try open_test(json, fixture_gpx);
    defer same.deinit();
    try testing.expect(same.value.course_matches);
    try testing.expectEqual(@as(f64, 0.004), same.value.model.fatigue_coefficient);
    try testing.expectEqual(@as(u64, 3), same.value.entry_count);
    try testing.expectEqualStrings("Synthetic 6K", same.value.course.name.?);

    // One byte less: the same route to the eye, another file to the hash.
    const edited = try open_test(json, fixture_gpx[0 .. fixture_gpx.len - 1]);
    defer edited.deinit();
    try testing.expect(!edited.value.course_matches);
    try testing.expectEqual(@as(f64, 0.004), edited.value.model.fatigue_coefficient);
}

test "openPlan: the model carries fueling and its resolved supplies" {
    var fueling = fueling_test;
    fueling.supplies = &.{ .full, .water, .full };
    const json = try build_test(.{ .fueling = fueling });
    defer testing.allocator.free(json);

    const report = try open_test(json, fixture_gpx);
    defer report.deinit();
    const model_fueling = report.value.model.fueling.?;
    try testing.expectEqual(@as(f64, 500), model_fueling.fluid_ml_per_h);
    try testing.expectEqualSlices(Supply, fueling.supplies, model_fueling.supplies);

    const off = try build_test(.{});
    defer testing.allocator.free(off);
    const report_off = try open_test(off, fixture_gpx);
    defer report_off.deinit();
    try testing.expect(report_off.value.model.fueling == null);
}

test "openPlan: a v1 plan reads with fueling off" {
    const json = try build_test(.{});
    defer testing.allocator.free(json);
    const v1 = try std.mem.replaceOwned(
        u8,
        testing.allocator,
        json,
        "\"schema_version\": 2",
        "\"schema_version\": 1",
    );
    defer testing.allocator.free(v1);
    try testing.expect(!std.mem.eql(u8, v1, json));
    const report = try open_test(v1, fixture_gpx);
    defer report.deinit();
    try testing.expect(report.value.course_matches);
    try testing.expect(report.value.model.fueling == null);
}

test "openPlan: gpxz's read errors reach the page" {
    const allocator = testing.allocator;
    try testing.expectError(
        error.SyntaxError,
        plan_open(allocator, allocator, "not json", fixture_gpx),
    );
    try testing.expectError(
        error.SchemaVersionUnsupported,
        plan_open(allocator, allocator, "{\"schema_version\": 3}", fixture_gpx),
    );

    const json = try build_test(.{});
    defer allocator.free(json);
    // A departure that is no longer arrival plus stop: an edit that broke the plan.
    const broken = try std.mem.replaceOwned(u8, allocator, json, "\"stop_s\": 0", "\"stop_s\": 7");
    defer allocator.free(broken);
    try testing.expect(!std.mem.eql(u8, broken, json));
    const result = plan_open(allocator, allocator, broken, fixture_gpx);
    try testing.expectError(error.PlanInvalid, result);
}

test "courseProfile: evenly spaced, start to finish, on the course's elevations" {
    const profile = try profile_build(testing.allocator, testing.allocator, fixture_gpx);
    defer testing.allocator.free(profile);
    try testing.expectEqual(@as(usize, profile_samples * 2), profile.len);

    var data = try gpxz.parse(testing.allocator, fixture_gpx, &.{});
    defer data.deinit(testing.allocator);
    var elevation_min_m: f64 = std.math.inf(f64);
    var elevation_max_m: f64 = -std.math.inf(f64);
    for (data.trace.points) |point| {
        elevation_min_m = @min(elevation_min_m, point[2]);
        elevation_max_m = @max(elevation_max_m, point[2]);
    }

    const last = profile_samples - 1;
    try testing.expectApproxEqAbs(data.trace.distance_m, profile[last * 2], 1e-6);
    const step_m = profile[2];
    try testing.expect(step_m > 0);
    for (0..profile_samples) |sample| {
        const expected_m = step_m * @as(f64, @floatFromInt(sample));
        try testing.expectApproxEqAbs(expected_m, profile[sample * 2], 1e-6);
        const elevation_m = profile[sample * 2 + 1];
        try testing.expect(elevation_m >= elevation_min_m and elevation_m <= elevation_max_m);
    }
    // The fixture climbs to the Refuge: the profile is not flat.
    try testing.expect(elevation_max_m > elevation_min_m);
}

test "courseProfile: a file that is not a GPX is refused" {
    const result = profile_build(testing.allocator, testing.allocator, "not a gpx");
    if (result) |profile| {
        testing.allocator.free(profile);
        return error.TestUnexpectedResult;
    } else |_| {}
}

test "courseUtcOffset: the first timed waypoint's offset, null in UTC or without a time" {
    const paris =
        \\<gpx><wpt lat="42.8" lon="0.3"><name>Aid</name></wpt>
        \\<wpt lat="42.8" lon="0.3"><name>Start</name><time>2026-08-21T05:00:00+02:00</time></wpt>
        \\<wpt lat="42.9" lon="0.3"><name>Finish</name><time>2026-08-22T05:00:00Z</time></wpt>
        \\</gpx>
    ;
    try testing.expectEqual(@as(?i32, 7200), try utc_offset_read(testing.allocator, paris));
    const utc = "<gpx><wpt lat=\"42.8\" lon=\"0.3\"><time>2026-08-21T03:00:00Z</time></wpt></gpx>";
    try testing.expectEqual(@as(?i32, null), try utc_offset_read(testing.allocator, utc));
    const untimed = "<gpx><wpt lat=\"42.8\" lon=\"0.3\"><name>Start</name></wpt></gpx>";
    try testing.expectEqual(@as(?i32, null), try utc_offset_read(testing.allocator, untimed));
    try testing.expectEqual(@as(?i32, null), try utc_offset_read(testing.allocator, fixture_gpx));
}

test "courseUtcOffset: a malformed waypoint is gpxz's parse error" {
    const broken = "<gpx><wpt lat=\"91\" lon=\"0\"></wpt></gpx>";
    try testing.expect(std.meta.isError(utc_offset_read(testing.allocator, broken)));
}

test "slowestPace: the slowest pace that holds, one second more misses" {
    const pace = (try pace_slowest(testing.allocator, fixture_gpx, .{})).?;
    try testing.expect(pace >= pace_base_s_per_km_min and pace < pace_base_s_per_km_max);
    try testing.expectEqual(@floor(pace), pace);

    var data = try gpxz.parse(testing.allocator, fixture_gpx, &.{});
    defer data.deinit(testing.allocator);
    var model: gpxz.Settings = .{ .pace_base_s_per_km = pace };
    try testing.expect(try cutoffs_hold(testing.allocator, &data, &model));
    model.pace_base_s_per_km = pace + 1;
    try testing.expect(!try cutoffs_hold(testing.allocator, &data, &model));
}

test "slowestPace: more fatigue leaves a faster pace" {
    const fresh = (try pace_slowest(testing.allocator, fixture_gpx, .{
        .fatigue_coefficient = 0,
    })).?;
    const tired = (try pace_slowest(testing.allocator, fixture_gpx, .{
        .fatigue_coefficient = fatigue_coefficient_max,
    })).?;
    try testing.expect(tired < fresh);
}

test "slowestPace: null without cutoffs, and when no pace makes them" {
    const untimed =
        \\<gpx><wpt lat="42.80" lon="0.30"><name>Start</name><type>Start</type></wpt>
        \\<wpt lat="42.82" lon="0.30"><name>Finish</name><type>Arrival</type></wpt>
        \\<trk><trkseg><trkpt lat="42.80" lon="0.30"><ele>800</ele></trkpt>
        \\<trkpt lat="42.81" lon="0.30"><ele>850</ele></trkpt>
        \\<trkpt lat="42.82" lon="0.30"><ele>900</ele></trkpt></trkseg></trk></gpx>
    ;
    try testing.expectEqual(@as(?f64, null), try pace_slowest(testing.allocator, untimed, .{}));
    // A minute for 2.2 km: under 2:00/km, Regimen's fastest.
    const impossible =
        \\<gpx><wpt lat="42.80" lon="0.30"><name>Start</name><type>Start</type>
        \\<time>2026-08-21T05:00:00Z</time></wpt>
        \\<wpt lat="42.82" lon="0.30"><name>Finish</name><type>Arrival</type>
        \\<time>2026-08-21T05:01:00Z</time></wpt>
        \\<trk><trkseg><trkpt lat="42.80" lon="0.30"><ele>800</ele></trkpt>
        \\<trkpt lat="42.81" lon="0.30"><ele>850</ele></trkpt>
        \\<trkpt lat="42.82" lon="0.30"><ele>900</ele></trkpt></trkseg></trk></gpx>
    ;
    try testing.expectEqual(@as(?f64, null), try pace_slowest(testing.allocator, impossible, .{}));
}

test "slowestPace: settings out of bounds are refused" {
    const result = pace_slowest(testing.allocator, fixture_gpx, .{ .pace_base_s_per_km = 60 });
    try testing.expectError(error.SettingsInvalid, result);
}
