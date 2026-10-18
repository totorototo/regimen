import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import useStore from "../../store/store.js";
import { readyState } from "../../test/fixtures.js";
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
