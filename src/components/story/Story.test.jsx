import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import useStore from "../../store/store.js";
import { fueledPlanFixture, readyState } from "../../test/fixtures.js";
import Story, { contourPath, storySections } from "./Story.jsx";

describe("storySections", () => {
  it("adds the fueling section only while fueling is on", () => {
    expect(storySections(false).map((section) => section.id)).toEqual([
      "hero",
      "model",
      "margin",
      "checkpoints",
      "end",
    ]);
    expect(storySections(true).map((section) => section.id)).toContain("fueling");
  });
});

describe("contourPath", () => {
  it("runs distance down the page and elevation across, inside the margins", () => {
    const path = contourPath(readyState.profile);
    // The lowest point at 15% of the 200-unit width, the highest at 85%; 6 km is 1000 down.
    expect(path).toBe("M30.0,0.0L170.0,500.0L35.6,1000.0");
  });

  it("draws nothing from fewer than two points", () => {
    expect(contourPath([])).toBeNull();
  });
});

describe("Story", () => {
  beforeEach(() => useStore.setState(readyState));

  it("draws the route behind its sections, and a dot per section", () => {
    const { container } = render(<Story />);
    expect(container.querySelector(".contour-line")).toHaveAttribute("d");
    const nav = screen.getByRole("navigation", { name: "Story sections" });
    expect(within(nav).getAllByRole("button")).toHaveLength(5);
  });

  it("gains a Fueling section when the plan has fueling", () => {
    useStore.setState({ plan: fueledPlanFixture });
    render(<Story />);
    const nav = screen.getByRole("navigation", { name: "Story sections" });
    expect(within(nav).getByRole("button", { name: "Jump to Fueling" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What the race takes" })).toBeInTheDocument();
  });
});
