import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import useStore from "../../../store/store.js";
import { fueledPlanFixture, readyState } from "../../../test/fixtures.js";
import StoryFueling from "./StoryFueling.jsx";

describe("StoryFueling", () => {
  beforeEach(() => useStore.setState(readyState));

  it("is not drawn while fueling is off", () => {
    const { container } = render(<StoryFueling />);
    expect(container).toBeEmptyDOMElement();
  });

  it("totals the race and counts the refills", () => {
    useStore.setState({ plan: fueledPlanFixture });
    render(<StoryFueling />);
    // 6000 s to the finish at 70 g/h, 500 ml/h and 400 mg/h, rounded up.
    const total = (label) =>
      within(screen.getByText("Whole race").parentElement).getByText(label).nextSibling;
    expect(total("Carbs")).toHaveTextContent("117 g");
    expect(total("Fluid")).toHaveTextContent("0.84 L");
    expect(total("Sodium")).toHaveTextContent("0.7 g");
    expect(screen.getByText("1 full refill, 1 water stop.")).toBeInTheDocument();
  });
});
