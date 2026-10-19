import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import useStore from "../../../store/store.js";
import { readyState } from "../../../test/fixtures.js";
import StoryModel from "./StoryModel.jsx";

const initial = useStore.getState();
const step = (label, field) => screen.getByRole("button", { name: `${label} ${field}` });
const value = (name) => screen.getByTestId(`model-${name}`);

describe("StoryModel", () => {
  beforeEach(() => useStore.setState({ ...initial, ...readyState, status: "idle" }, true));
  afterEach(() => vi.useRealTimers());

  it("shows each input as a stepper: its name, its value and unit, read only", () => {
    render(<StoryModel />);
    const pace = screen.getByRole("group", { name: "Flat pace" });
    expect(pace).toHaveAccessibleDescription(/On flat ground/);
    expect(value("pace")).toHaveTextContent("8:20 min/km");
    expect(value("fatigue")).toHaveTextContent("0.002 /km");
    expect(value("lifeBaseStopMin")).toHaveTextContent("60 min");
    expect(screen.queryByRole("textbox")).toBeNull();
    // Its help shows in the group's hint line while the row has focus.
    const [hint] = document.querySelectorAll(".hint");
    expect(hint).toHaveTextContent("Hold − or + to step faster.");
    fireEvent.focus(step("Increase", "Fatigue"));
    expect(hint).toHaveTextContent(/0.002 is about 22% slower/);
    fireEvent.blur(step("Increase", "Fatigue"));
    expect(hint).toHaveTextContent("Hold − or + to step faster.");
  });

  it("steps a value with its buttons, and recomputes", () => {
    render(<StoryModel />);
    fireEvent.click(step("Increase", "Flat pace"));
    expect(value("pace")).toHaveTextContent("8:25");
    fireEvent.click(step("Decrease", "Flat pace"));
    fireEvent.click(step("Decrease", "Flat pace"));
    expect(value("pace")).toHaveTextContent("8:15");
    expect(useStore.getState().settings.pace_base_s_per_km).toBe(495);
  });

  it("repeats a step while its button is held, without an extra step on release", () => {
    vi.useFakeTimers();
    render(<StoryModel />);
    const plus = step("Increase", "LifeBase stop");
    fireEvent.pointerDown(plus, { pointerType: "touch" });
    act(() => vi.advanceTimersByTime(400 + 80 * 3));
    fireEvent.pointerUp(plus);
    fireEvent.click(plus);
    // One step at 400 ms, then one every 80 ms: 60 → 80.
    expect(value("lifeBaseStopMin")).toHaveTextContent("80 min");
  });

  it("stops at the bound gpxz enforces", () => {
    useStore.getState().setField("fatigue", "0");
    render(<StoryModel />);
    expect(step("Decrease", "Fatigue")).toBeDisabled();
    expect(step("Increase", "Fatigue")).toBeEnabled();
  });

  it("keeps fueling off until asked, then shows its four steppers", () => {
    render(<StoryModel />);
    const fueling = screen.getByRole("button", { name: /^Fueling/ });
    expect(fueling).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("group", { name: "Carbs" })).toBeNull();

    fireEvent.click(fueling);
    expect(fueling).toHaveAttribute("aria-pressed", "true");
    expect(value("carbs")).toHaveTextContent("60 g/h");
    expect(value("fluid")).toHaveTextContent("500 ml/h");
    expect(value("sodium")).toHaveTextContent("400 mg/h");
    expect(value("reserveMin")).toHaveTextContent("30 min");
    expect(useStore.getState().settings.fueling).toMatchObject({ reserve_s: 1800 });

    fireEvent.click(step("Increase", "Fluid"));
    expect(value("fluid")).toHaveTextContent("550 ml/h");

    fireEvent.click(fueling);
    expect(screen.queryByRole("group", { name: "Carbs" })).toBeNull();
    expect(useStore.getState().settings.fueling).toBeNull();
  });
});
