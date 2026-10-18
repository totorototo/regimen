//! regimen: the WebAssembly boundary. JavaScript hands over the raw bytes of an extended GPX
//! (from waymark) and the pace model's inputs, and gets `plan.json` back. All the work lives in
//! gpxz, reading and writing alike:
//!
//! - `buildPlan`: the plan for a course and a model, as the exact bytes of `plan.json`.
//! - `openPlan`: a saved `plan.json` read and validated, with whether it was made for the
//!   course that is open.
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

/// Multi-day ultra GPX files are a few MiB; as gpxz's CLI bounds them.
pub const gpx_bytes_max = 64 * 1024 * 1024;

/// The pace model's inputs, as JavaScript passes them. Missing fields take gpxz's defaults.
pub const PlanSettings = struct {
    pace_base_s_per_km: f64 = gpxz.pace_model.pace_base_s_per_km_default,
    fatigue_coefficient: f64 = gpxz.pace_model.fatigue_coefficient_default,
    life_base_stop_s: u32 = gpxz.pace_model.life_base_stop_s_default,
};

/// The bounds a setting must fall in. They are errors, not asserts: the values come from a
/// form, and the WASM build is ReleaseSmall, where a failed assert is undefined behaviour
/// rather than a crash. Past them the model stops meaning anything (a 60:00 /km flat pace),
/// and fatigue grows as exp(k·d), so a large k overflows the durations of a 300 km race.
pub const pace_base_s_per_km_min = 120.0;
pub const pace_base_s_per_km_max = 3600.0;
pub const fatigue_coefficient_max = 0.05;
pub const life_base_stop_s_max: u32 = 24 * 3600;

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

// Implementation (snake_case, testable with any pair of allocators)

fn settings_check(settings: *const PlanSettings) error{SettingsInvalid}!gpxz.Settings {
    const pace = settings.pace_base_s_per_km;
    if (!(pace >= pace_base_s_per_km_min and pace <= pace_base_s_per_km_max)) {
        return error.SettingsInvalid;
    }
    const fatigue = settings.fatigue_coefficient;
    if (!(fatigue >= 0 and fatigue <= fatigue_coefficient_max)) return error.SettingsInvalid;
    if (settings.life_base_stop_s > life_base_stop_s_max) return error.SettingsInvalid;
    const result: gpxz.Settings = .{
        .pace_base_s_per_km = pace,
        .fatigue_coefficient = fatigue,
        .life_base_stop_s = settings.life_base_stop_s,
    };
    result.assert_valid();
    return result;
}

fn plan_build(
    scratch: std.mem.Allocator,
    output: std.mem.Allocator,
    gpx_bytes: []const u8,
    settings: PlanSettings,
) ![]u8 {
    if (gpx_bytes.len > gpx_bytes_max) return error.FileTooLarge;
    const gpxz_settings = try settings_check(&settings);
    var data = try gpxz.parse(scratch, gpx_bytes, &gpxz_settings);
    defer data.deinit(scratch);
    // A plan needs a Start and somewhere to go: a file without two typed checkpoints is a
    // route waymark has not been through yet.
    const entries = data.plan orelse return error.CheckpointsTooFew;
    if (entries.len < 2) return error.CheckpointsTooFew;

    const plan = gpxz.plan_build(
        gpx_bytes,
        data.metadata.name,
        data.trace.distance_m,
        entries,
        &gpxz_settings,
    );
    var out: std.Io.Writer.Allocating = .init(output);
    errdefer out.deinit();
    try gpxz.plan_write(&out.writer, &plan);
    const json = try out.toOwnedSlice();
    assert(json.len > 0 and json[json.len - 1] == '\n');
    return json;
}

/// What the page needs from a saved plan: the model to put back in the form, and whether the
/// plan is for this course. The entries stay behind: the page recomputes them from the model,
/// so what it shows is always gpxz's plan for the open file.
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

test "openPlan: gpxz's read errors reach the page" {
    const allocator = testing.allocator;
    try testing.expectError(
        error.SyntaxError,
        plan_open(allocator, allocator, "not json", fixture_gpx),
    );
    try testing.expectError(
        error.SchemaVersionUnsupported,
        plan_open(allocator, allocator, "{\"schema_version\": 2}", fixture_gpx),
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
