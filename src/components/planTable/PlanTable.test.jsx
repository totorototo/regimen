import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useStore from "../../store/store.js";
import { fueledPlanFixture, readyState } from "../../test/fixtures.js";
import PlanTable from "./PlanTable.jsx";

describe("PlanTable", () => {
  beforeEach(() => useStore.setState(readyState));

  it("has a row per checkpoint, in race order", () => {
    render(<PlanTable />);
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows.map((row) => within(row).getByRole("rowheader").textContent)).toEqual([
      "StartStart",
      "RefugeLifeBase",
      "FinishArrival",
    ]);
    expect(within(rows[1]).getByText("1h00")).toBeInTheDocument();
    expect(within(rows[1]).getByText("10 min")).toBeInTheDocument();
  });

  it("marks a missed cutoff and a tight one, and counts the missed", () => {
    render(<PlanTable />);
    expect(screen.getByText("−0h15")).toHaveClass("over");
    expect(screen.getByText("0h10")).toHaveClass("tight");
    const missed = screen.getByText("Cutoffs missed").nextSibling;
    expect(missed).toHaveTextContent("1");
    const finish = screen.getByText("Finish", { selector: "dt" }).nextSibling;
    expect(finish).toHaveTextContent("1h40");
  });

  it("shows no margin at the start, whose time is not a cutoff", () => {
    render(<PlanTable />);
    const start = within(screen.getByRole("table")).getAllByRole("row")[1];
    expect(start.lastChild).toHaveTextContent("–");
    expect(start.lastChild).not.toHaveClass("tight");
  });

  it("has no fueling columns or totals while fueling is off", () => {
    render(<PlanTable />);
    expect(screen.queryByRole("columnheader", { name: "Refill" })).toBeNull();
    expect(screen.queryByText("Carbs")).toBeNull();
  });

  it("shows each refill, marks one that differs from the default, and what to leave with", () => {
    useStore.setState({ plan: fueledPlanFixture });
    render(<PlanTable />);
    const start = screen.getByRole("combobox", { name: "Refill at Start" });
    const refuge = screen.getByRole("combobox", { name: "Refill at Refuge" });
    expect(start).toHaveValue("full");
    expect(start).not.toHaveClass("changed");
    // A LifeBase is full by default: water is the runner's choice.
    expect(refuge).toHaveValue("water");
    expect(refuge).toHaveClass("changed");
    expect(refuge).toHaveAttribute("title", "Default: full");
    // Nothing comes after the finish: no refill to choose.
    expect(screen.queryByRole("combobox", { name: "Refill at Finish" })).toBeNull();

    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows[0].lastChild).toHaveTextContent("175 g · 1.25 L · 1 g Na");
    expect(rows[1].lastChild).toHaveTextContent("0.9 L");
    expect(rows[2].lastChild).toHaveTextContent("–");
  });

  it("sends a refill change to the store", () => {
    const setSupply = vi.fn();
    useStore.setState({ plan: fueledPlanFixture, setSupply });
    render(<PlanTable />);
    fireEvent.change(screen.getByRole("combobox", { name: "Refill at Start" }), {
      target: { value: "none" },
    });
    expect(setSupply).toHaveBeenCalledWith(0, "none");
  });

  it("totals the race's carbs and fluid at the hourly targets", () => {
    useStore.setState({ plan: fueledPlanFixture });
    render(<PlanTable />);
    // 6000 s to the finish: 70 g/h and 500 ml/h.
    expect(screen.getByText("Carbs", { selector: "dt" }).nextSibling).toHaveTextContent("117 g");
    expect(screen.getByText("Fluid", { selector: "dt" }).nextSibling).toHaveTextContent("0.84 L");
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
