import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useStore from "../../store/store.js";
import { fueledPlanFixture, readyState } from "../../test/fixtures.js";
import PlanTable from "./PlanTable.jsx";

const rows = () => within(screen.getByRole("list")).getAllByRole("listitem");
const row = (name) => rows().find((item) => within(item).queryByRole("heading", { name }));

describe("PlanTable", () => {
  beforeEach(() => useStore.setState(readyState));

  it("has a row per checkpoint, in race order, with its type, distance and gain", () => {
    render(<PlanTable />);
    expect(rows().map((item) => within(item).getByRole("heading").textContent)).toEqual([
      "Start",
      "Refuge",
      "Finish",
    ]);
    const refuge = row("Refuge");
    expect(refuge).toHaveTextContent("LifeBase · 3.0 km · D+ 250 m");
    expect(within(refuge).getByText("1h00")).toHaveClass("time");
    expect(within(refuge).getByText("10 min")).toBeInTheDocument();
    expect(row("Finish")).toHaveTextContent("Finish · 6.0 km");
  });

  it("badges each cutoff with the suite's words, and marks the missed margin", () => {
    render(<PlanTable />);
    expect(within(row("Refuge")).getByText("Over")).toHaveClass("badge", "over");
    expect(within(row("Refuge")).getByText("−0h15")).toHaveClass("over");
    // 0h10 to spare: under an hour is Tight.
    expect(within(row("Finish")).getByText("Tight")).toHaveClass("tight");
  });

  it("shows no margin or badge at the start, whose time is not a cutoff", () => {
    render(<PlanTable />);
    const start = row("Start");
    expect(within(start).getByText("Margin").nextSibling).toHaveTextContent("–");
    expect(within(start).queryByText(/OK|Tight|Over/)).toBeNull();
  });

  it("has no fueling while it is off", () => {
    render(<PlanTable />);
    expect(screen.queryByRole("group", { name: /Refill/ })).toBeNull();
    expect(screen.queryByText("Leave with")).toBeNull();
  });

  it("shows each refill, marks one that differs from the default, and what to leave with", () => {
    useStore.setState({ plan: fueledPlanFixture });
    render(<PlanTable />);
    const start = screen.getByRole("group", { name: "Refill at Start" });
    const refuge = screen.getByRole("group", { name: "Refill at Refuge" });
    expect(within(start).getByRole("button", { name: "Full" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(start).not.toHaveClass("changed");
    // A LifeBase is full by default: water is the runner's choice.
    expect(within(refuge).getByRole("button", { name: "Water" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(refuge).toHaveClass("changed");
    expect(within(row("Refuge")).getByText("Changed from full.")).toBeInTheDocument();
    // Nothing comes after the finish: no refill to choose.
    expect(screen.queryByRole("group", { name: "Refill at Finish" })).toBeNull();

    const leave = (name) => within(row(name)).getByText("Leave with").nextSibling;
    expect(leave("Start")).toHaveTextContent("175 g · 1.25 L · 1 g Na");
    expect(leave("Refuge")).toHaveTextContent("0.9 L");
  });

  it("sends a refill change to the store", () => {
    const setSupply = vi.fn();
    useStore.setState({ plan: fueledPlanFixture, setSupply });
    render(<PlanTable />);
    const start = screen.getByRole("group", { name: "Refill at Start" });
    fireEvent.click(within(start).getByRole("button", { name: "None" }));
    expect(setSupply).toHaveBeenCalledWith(0, "none");
  });

  it("dims the plan while it is recomputed", () => {
    useStore.setState({ planStatus: "computing" });
    render(<PlanTable />);
    expect(screen.getByRole("region", { name: "Plan" })).toHaveAttribute("aria-busy", "true");
  });

  it("says why there is no plan", () => {
    useStore.setState({ planStatus: "error", planError: "Settings invalid", plan: null });
    render(<PlanTable />);
    expect(screen.getByRole("alert")).toHaveTextContent("Settings invalid");
  });
});
