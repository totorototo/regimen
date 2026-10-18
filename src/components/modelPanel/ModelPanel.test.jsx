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

  it("keeps fueling off until asked, then shows its four fields", () => {
    render(<ModelPanel />);
    const toggle = screen.getByRole("checkbox", { name: /Plan what to eat and drink/ });
    expect(toggle).not.toBeChecked();
    expect(screen.queryByLabelText(/Carbs/)).toBeNull();
    expect(useStore.getState().settings.fueling).toBeNull();

    fireEvent.click(toggle);
    expect(screen.getByRole("group", { name: "Fueling" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Carbs/)).toHaveValue("60");
    expect(screen.getByLabelText(/Fluid/)).toHaveValue("500");
    expect(screen.getByLabelText(/Sodium/)).toHaveValue("400");
    expect(screen.getByLabelText(/Reserve/)).toHaveValue("30");
    expect(useStore.getState().settings.fueling).toMatchObject({ reserve_s: 1800 });

    const carbs = screen.getByLabelText(/Carbs/);
    fireEvent.change(carbs, { target: { value: "200" } });
    expect(carbs).toHaveAttribute("aria-invalid", "true");
    expect(carbs).toHaveAccessibleDescription(/0 to 150/);

    fireEvent.click(toggle);
    expect(screen.queryByLabelText(/Carbs/)).toBeNull();
    expect(useStore.getState().settings.fueling).toBeNull();
  });
});
