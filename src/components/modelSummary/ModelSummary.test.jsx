import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_FUELING, DEFAULT_SETTINGS } from "../../plan/settings.js";
import useStore from "../../store/store.js";
import { readyState } from "../../test/fixtures.js";
import ModelSummary from "./ModelSummary.jsx";

describe("ModelSummary", () => {
  beforeEach(() => useStore.setState(readyState));

  it("folds the model into two lines", () => {
    render(<ModelSummary editing={false} onToggle={() => {}} controls="panel" />);
    expect(screen.getByText("8:20 /km · fatigue 0.002 · LifeBase 60 min")).toBeInTheDocument();
    expect(screen.getByText("Fueling off")).toBeInTheDocument();
  });

  it("writes the fueling targets when it is on", () => {
    const fueling = { ...DEFAULT_FUELING, supplies: [] };
    useStore.setState({ settings: { ...DEFAULT_SETTINGS, fueling } });
    render(<ModelSummary editing={false} onToggle={() => {}} controls="panel" />);
    expect(screen.getByText("60 g · 500 ml · 400 mg per hour · reserve 30 min")).toBeVisible();
  });

  it("opens and closes the cards it controls", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <ModelSummary editing={false} onToggle={onToggle} controls="panel" />,
    );
    const edit = screen.getByRole("button", { name: "Edit" });
    expect(edit).toHaveAttribute("aria-expanded", "false");
    expect(edit).toHaveAttribute("aria-controls", "panel");
    fireEvent.click(edit);
    expect(onToggle).toHaveBeenCalledTimes(1);

    rerender(<ModelSummary editing onToggle={onToggle} controls="panel" />);
    expect(screen.getByRole("button", { name: "Done" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByText("Fueling off")).toBeNull();
  });
});
