import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useStore from "../../store/store.js";
import { readyState } from "../../test/fixtures.js";
import PlanNotice from "./PlanNotice.jsx";

describe("PlanNotice", () => {
  beforeEach(() => useStore.setState(readyState));

  it("shows nothing without a notice", () => {
    const { container } = render(<PlanNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it("confirms an applied model", () => {
    useStore.setState({ notice: { kind: "applied", fileName: "a.plan.json" } });
    render(<PlanNotice />);
    expect(screen.getByRole("status")).toHaveTextContent("Opened a.plan.json");
  });

  it("says when a saved plan's refills were replaced by this course's defaults", () => {
    useStore.setState({
      notice: { kind: "applied", fileName: "a.plan.json", suppliesReset: true },
    });
    render(<PlanNotice />);
    expect(screen.getByRole("status")).toHaveTextContent("this course's defaults are used");
  });

  it("offers another course's model, and takes it on request", () => {
    const applyNoticeModel = vi.fn();
    useStore.setState({
      applyNoticeModel,
      notice: {
        kind: "mismatch",
        fileName: "old.plan.json",
        course: { name: "GRP 80", distance_m: 80482 },
        model: {},
      },
    });
    render(<PlanNotice />);
    expect(screen.getByRole("alert")).toHaveTextContent("made for GRP 80 (80.5 km)");
    fireEvent.click(screen.getByRole("button", { name: "Use its model anyway" }));
    expect(applyNoticeModel).toHaveBeenCalled();
  });

  it("explains a refused file, and dismisses", () => {
    useStore.setState({
      notice: { kind: "error", fileName: "x.json", message: "Not a plan.", detail: "Syntax error" },
    });
    render(<PlanNotice />);
    expect(screen.getByRole("alert")).toHaveTextContent("x.json could not be read. Not a plan.");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(useStore.getState().notice).toBeNull();
  });
});
