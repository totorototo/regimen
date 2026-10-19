import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import useStore from "../../../store/store.js";
import { entry, planFixture, readyState } from "../../../test/fixtures.js";
import StoryMargin, { cutoffBars, kmTicks } from "./StoryMargin.jsx";

describe("cutoffBars", () => {
  it("keeps the cutoffs only, with their tier", () => {
    expect(cutoffBars(planFixture)).toEqual([
      { name: "Refuge", distance_m: 3000, margin_s: -900, tier: "over" },
      { name: "Finish", distance_m: 6000, margin_s: 600, tier: "tight" },
    ]);
  });
});

describe("kmTicks", () => {
  it("picks round steps, at most six along the course", () => {
    expect(kmTicks(6000)).toEqual([0, 5]);
    expect(kmTicks(42195)).toEqual([0, 10, 20, 30, 40]);
    expect(kmTicks(171200)).toEqual([0, 50, 100, 150]);
  });
});

describe("StoryMargin", () => {
  beforeEach(() => useStore.setState(readyState));

  it("draws the margin as a line over its area, a dot per cutoff in its tier", () => {
    const { container } = render(<StoryMargin />);
    expect(container.querySelector(".margin-edge")).toHaveAttribute(
      "d",
      expect.stringMatching(/^M150,/),
    );
    const dots = container.querySelectorAll(".dot");
    expect(dots).toHaveLength(2);
    expect(dots[0]).toHaveClass("over");
    expect(dots[0].style.left).toBe("50%");
    expect(dots[1]).toHaveClass("tight");
    expect(dots[1].style.left).toBe("100%");
    // The hour under the cutoff line, banded as tight.
    expect(container.querySelector(".tight-band")).toBeInTheDocument();
  });

  it("reads out the tightest cutoff, then the one a mouse points at", () => {
    const { container } = render(<StoryMargin />);
    const readout = container.querySelector(".readout");
    expect(readout).toHaveTextContent("Refugekm 3.0over by 0h15Overthe tightest");
    const plot = screen.getByRole("slider", { name: "Margin at each cutoff" });
    plot.getBoundingClientRect = () => ({ left: 0, width: 600 });
    fireEvent.pointerMove(plot, { clientX: 590, pointerType: "mouse" });
    expect(readout).toHaveTextContent("Finishkm 6.00h10 to spareTight");
    fireEvent.pointerLeave(plot, { pointerType: "mouse" });
    expect(readout).toHaveTextContent("Refuge");
  });

  it("pins the cutoff a finger taps, until a tap elsewhere", () => {
    const { container } = render(<StoryMargin />);
    const readout = container.querySelector(".readout");
    const plot = screen.getByRole("slider");
    plot.getBoundingClientRect = () => ({ left: 0, width: 600 });
    fireEvent.pointerDown(plot, { clientX: 590, pointerType: "touch" });
    // A finger lifting leaves the plot: the reading stays.
    fireEvent.pointerLeave(plot, { pointerType: "touch" });
    expect(readout).toHaveTextContent("Finish");
    fireEvent.pointerDown(document.body, { pointerType: "touch" });
    expect(readout).toHaveTextContent("Refuge");
  });

  it("steps from cutoff to cutoff with the arrow keys", () => {
    render(<StoryMargin />);
    const plot = screen.getByRole("slider");
    expect(plot).toHaveAttribute("aria-valuetext", "Refuge, over by 0h15");
    fireEvent.keyDown(plot, { key: "ArrowRight" });
    expect(plot).toHaveAttribute("aria-valuetext", "Finish, 0h10 to spare");
    expect(plot).toHaveAttribute("aria-valuenow", "2");
    fireEvent.keyDown(plot, { key: "ArrowRight" });
    expect(plot).toHaveAttribute("aria-valuenow", "2");
    fireEvent.keyDown(plot, { key: "Home" });
    expect(plot).toHaveAttribute("aria-valuetext", "Refuge, over by 0h15");
  });

  it("names the band and the scale in a legend", () => {
    const { container } = render(<StoryMargin />);
    expect(container.querySelector(".legend")).toHaveTextContent(
      "tight, under 1h overtop of the chart: 1h00 to spare",
    );
  });

  it("says when the course has no cutoffs", () => {
    const plan = { ...planFixture, entries: [entry(), entry({ name: "Finish" })] };
    useStore.setState({ plan });
    render(<StoryMargin />);
    expect(screen.getByText("No cutoffs on this course.")).toBeInTheDocument();
  });
});
