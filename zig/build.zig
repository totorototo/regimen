//! Native build: `zig build test` runs regimen.zig's tests against the fixture.
//!
//! Zigar does not use this file (the Vite plugin runs with `ignoreBuildFile: true`); it builds
//! the WASM module with its own build.zig and takes the imports from build.extra.zig. Both
//! read the dependencies from build.zig.zon.

const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});
    const dependency_options = .{ .target = target, .optimize = optimize };

    const regimen = b.createModule(.{
        .root_source_file = b.path("regimen.zig"),
        .target = target,
        .optimize = optimize,
        .imports = &.{
            .{ .name = "gpxz", .module = b.dependency("gpxz", dependency_options).module("gpxz") },
        },
    });
    // @embedFile can't reach outside the module's directory tree by path, so the fixture is a
    // named import.
    regimen.addAnonymousImport("fixture.gpx", .{
        .root_source_file = b.path("testdata/route.gpx"),
    });

    const tests = b.addTest(.{ .root_module = regimen });
    const test_step = b.step("test", "Run regimen's Zig tests");
    test_step.dependOn(&b.addRunArtifact(tests).step);
}
