import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import useStore from "../../store/store.js";
import { readyState } from "../../test/fixtures.js";
import ModelPanel from "./ModelPanel.jsx";

const initial = useStore.getState();

describe("ModelPanel", () => {
  beforeEach(() => useStore.setState({ ...initial, ...readyState, status: "idle" }, true));

  it("shows the model's three fields with their units", () => {
    render(<ModelPanel />);
    expect(screen.getByLabelText(/Flat pace/)).toHaveValue("8:20");
    expect(screen.getByLabelText(/Fatigue/)).toHaveValue("0.002");
    expect(screen.getByLabelText(/LifeBase stop/)).toHaveValue("60");
  });

  it("marks a value that does not parse, and says why in its help", () => {
    render(<ModelPanel />);
    const pace = screen.getByLabelText(/Flat pace/);
    fireEvent.change(pace, { target: { value: "quick" } });
    expect(pace).toHaveValue("quick");
    expect(pace).toHaveAttribute("aria-invalid", "true");
    expect(pace).toHaveAccessibleDescription(/2:00 to 60:00/);

    fireEvent.change(pace, { target: { value: "7:00" } });
    expect(pace).toHaveAttribute("aria-invalid", "false");
    expect(useStore.getState().settings.pace_base_s_per_km).toBe(420);
  });
});
