import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import useStore from "../../../store/store.js";
import { readyState } from "../../../test/fixtures.js";
import StoryHero from "./StoryHero.jsx";

const value = (label) => screen.getByText(label, { selector: "dt" }).nextSibling;

describe("StoryHero", () => {
  beforeEach(() => useStore.setState(readyState));

  it("names the course, then the finish, the course's figures and the cutoffs", () => {
    render(<StoryHero />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Synthetic 6K");
    expect(value("Finish")).toHaveTextContent("1h40");
    expect(value("Distance")).toHaveTextContent("6.0 km");
    expect(value("Gain")).toHaveTextContent("260 m");
    expect(value("Cutoffs missed")).toHaveTextContent("1");
    expect(value("Cutoffs missed")).toHaveClass("over");
    expect(screen.getByText("Over")).toHaveClass("badge", "over");
    expect(screen.getByText(/Refuge is past its cutoff by 0h15/)).toBeInTheDocument();
  });

  it("dims while the plan is recomputed", () => {
    useStore.setState({ planStatus: "computing" });
    render(<StoryHero />);
    expect(screen.getByRole("region", { name: "Verdict" })).toHaveAttribute("aria-busy", "true");
  });
});
