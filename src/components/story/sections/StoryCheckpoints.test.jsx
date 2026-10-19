import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useStore from "../../../store/store.js";
import { fueledPlanFixture, readyState } from "../../../test/fixtures.js";
import { entry } from "../../../test/fixtures.js";
import StoryCheckpoints, { hiddenNews } from "./StoryCheckpoints.jsx";

const items = () =>
  within(screen.getByRole("list", { name: "Checkpoints" })).getAllByRole("listitem");
const item = (name) => items().find((li) => within(li).queryByRole("heading", { name }));

describe("StoryCheckpoints", () => {
  beforeEach(() => useStore.setState(readyState));

  it("lists each checkpoint in race order, with its type, distance, stop and arrival", () => {
    render(<StoryCheckpoints />);
    expect(items().map((li) => within(li).getByRole("heading").textContent)).toEqual([
      "Start",
      "Refuge",
      "Finish",
    ]);
    expect(item("Refuge")).toHaveTextContent("3.0 km · LifeBase · stop 10 min");
    expect(within(item("Refuge")).getByText("1h00")).toHaveClass("time");
    expect(within(item("Start")).getByText("0h00")).toHaveClass("time");
  });

  it("says the leg run to reach each checkpoint, tagged by how hard it climbs", () => {
    render(<StoryCheckpoints />);
    expect(item("Start").querySelector(".leg")).toBeNull();
    const refuge = item("Refuge").querySelector(".leg");
    expect(refuge).toHaveTextContent("3.0 km · D+ 250 m · 1h00 on the move");
    expect(refuge.querySelector(".effort")).toHaveClass("effort-5");
    expect(item("Finish").querySelector(".effort")).toHaveClass("effort-1");
  });

  it("badges only the news, and says the margin in words", () => {
    render(<StoryCheckpoints />);
    expect(within(item("Refuge")).getByText("Over")).toHaveClass("badge", "over");
    expect(item("Refuge")).toHaveTextContent("Over by 0h15");
    expect(item("Refuge")).toHaveClass("over");
    expect(within(item("Finish")).getByText("Tight")).toHaveClass("badge", "tight");
    expect(item("Finish")).toHaveTextContent("0h10 to spare");
    // The start's time is not a cutoff.
    expect(item("Start")).not.toHaveTextContent(/spare|Over|No cutoff/);
  });

  it("has no refills while fueling is off", () => {
    render(<StoryCheckpoints />);
    expect(screen.queryByRole("group", { name: /Refill/ })).toBeNull();
  });

  it("shows each refill, marks one that differs from the default, and what to leave with", () => {
    useStore.setState({ plan: fueledPlanFixture });
    render(<StoryCheckpoints />);
    const pressed = (name) =>
      within(screen.getByRole("group", { name: `Refill at ${name}` }))
        .getAllByRole("button")
        .filter((button) => button.getAttribute("aria-pressed") === "true")
        .map((button) => button.textContent);
    expect(pressed("Start")).toEqual(["Full"]);
    expect(within(item("Start")).queryByText(/^was /)).toBeNull();
    // A LifeBase is full by default: water is the runner's choice.
    expect(pressed("Refuge")).toEqual(["Water"]);
    expect(within(item("Refuge")).getByText("was full")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Refill at Finish" })).toBeNull();
    expect(item("Start")).toHaveTextContent("Leave with 175 g · 1.25 L · 1 g Na");
    expect(item("Refuge")).toHaveTextContent("Leave with 0.9 L");
  });

  it("sends a refill change to the store", () => {
    const setSupply = vi.fn();
    useStore.setState({ plan: fueledPlanFixture, setSupply });
    render(<StoryCheckpoints />);
    const start = screen.getByRole("group", { name: "Refill at Start" });
    fireEvent.click(within(start).getByRole("button", { name: "None" }));
    expect(setSupply).toHaveBeenCalledWith(0, "none");
  });

  it("dims while the plan is recomputed, and says why there is none", () => {
    useStore.setState({ planStatus: "computing" });
    const { unmount } = render(<StoryCheckpoints />);
    expect(screen.getByRole("list", { name: "Checkpoints" })).toHaveAttribute("aria-busy", "true");
    unmount();
    useStore.setState({ planStatus: "error", planError: "Settings invalid", plan: null });
    render(<StoryCheckpoints />);
    expect(screen.getByRole("alert")).toHaveTextContent("Settings invalid");
  });

  it("shows a long race's first six checkpoints, and says what the rest hold", () => {
    const entries = Array.from({ length: 12 }, (_, index) =>
      entry({
        name: `CP${index}`,
        index,
        distance_m: index * 1000,
        duration_s_arrival: index * 600,
        duration_s_departure: index * 600,
        margin_s: index === 9 ? -60 : index === 10 ? 1200 : 7200,
      }),
    );
    useStore.setState({ plan: { ...readyState.plan, entries } });
    render(<StoryCheckpoints />);
    expect(items()).toHaveLength(6);
    const more = screen.getByRole("button", { name: "Show 6 more checkpoints · 1 tight, 1 over" });
    fireEvent.click(more);
    expect(items()).toHaveLength(12);
    expect(screen.queryByRole("button", { name: /more checkpoints/ })).toBeNull();
  });

  it("shows a list only a little longer than six whole", () => {
    const entries = Array.from({ length: 8 }, (_, index) => entry({ name: `CP${index}`, index }));
    useStore.setState({ plan: { ...readyState.plan, entries } });
    render(<StoryCheckpoints />);
    expect(items()).toHaveLength(8);
  });
});

describe("hiddenNews", () => {
  it("counts the tight and missed cutoffs from a row on", () => {
    const entries = [
      entry(),
      entry({ margin_s: -60 }),
      entry({ margin_s: 600 }),
      entry({ margin_s: 7200 }),
    ];
    expect(hiddenNews(entries, 1)).toBe("1 tight, 1 over");
    expect(hiddenNews(entries, 3)).toBe("");
  });
});
