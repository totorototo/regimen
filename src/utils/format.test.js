import { describe, expect, it } from "vitest";

import { formatDuration, formatKm, formatMargin, formatPace, parsePace } from "./format.js";

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
});
