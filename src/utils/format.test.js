import { describe, expect, it } from "vitest";

import {
  formatCarry,
  formatDuration,
  formatKm,
  formatLitres,
  formatMargin,
  formatPace,
  parsePace,
} from "./format.js";

describe("format", () => {
  it("writes distances in km", () => {
    expect(formatKm(42195)).toBe("42.2 km");
    expect(formatKm(0)).toBe("0.0 km");
    expect(formatKm(NaN)).toBe("–");
  });

  it("writes durations as minutes under an hour, else XhMM", () => {
    expect(formatDuration(600)).toBe("10 min");
    expect(formatDuration(5400)).toBe("1h30");
    expect(formatDuration(-5400)).toBe("-1h30");
    expect(formatDuration(Infinity)).toBe("–");
  });

  it("writes and reads paces as m:ss", () => {
    expect(formatPace(500)).toBe("8:20");
    expect(formatPace(0)).toBe("–");
    expect(parsePace("8:20")).toBe(500);
    expect(parsePace(" 7 ")).toBe(420);
    expect(parsePace("0")).toBeNull();
    expect(parsePace("7:60")).toBeNull();
    expect(parsePace("fast")).toBeNull();
    expect(parsePace(undefined)).toBeNull();
  });

  it("writes margins with a minus sign, and caps them at 99h", () => {
    expect(formatMargin(3840)).toBe("1h04");
    expect(formatMargin(420)).toBe("0h07");
    expect(formatMargin(-1440)).toBe("−0h24");
    expect(formatMargin(-10)).toBe("0h00");
    expect(formatMargin(100 * 3600)).toBe("99h+");
    expect(formatMargin(null)).toBe("–");
  });

  it("writes litres rounded up to 10 ml", () => {
    expect(formatLitres(1650)).toBe("1.65 L");
    expect(formatLitres(900)).toBe("0.9 L");
    expect(formatLitres(1651)).toBe("1.66 L");
    expect(formatLitres(1000)).toBe("1 L");
    expect(formatLitres(NaN)).toBe("–");
  });

  it("writes a carry by what the point refills", () => {
    const full = { carbs_g: 455, fluid_ml: 1650, sodium_mg: 2600 };
    expect(formatCarry(full)).toBe("455 g · 1.65 L · 2.6 g Na");
    expect(formatCarry({ carbs_g: null, fluid_ml: 900, sodium_mg: null })).toBe("0.9 L");
    expect(formatCarry(null)).toBe("–");
    expect(formatCarry(undefined)).toBe("–");
    // Sodium rounds up to 0.1 g, as the rest.
    expect(formatCarry({ ...full, sodium_mg: 2601 })).toBe("455 g · 1.65 L · 2.7 g Na");
  });
});
