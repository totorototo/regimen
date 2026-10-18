import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import useStore from "../../store/store.js";
import { readyState } from "../../test/fixtures.js";
import Verdict from "./Verdict.jsx";

describe("Verdict", () => {
  beforeEach(() => useStore.setState(readyState));

  it("leads with the course, the finish and a line on the cutoffs", () => {
    render(<Verdict />);
    expect(screen.getByText("Synthetic 6K · 6.0 km · D+ 260 m")).toBeInTheDocument();
    expect(screen.getByText("Finish", { selector: "dt" }).nextSibling).toHaveTextContent("1h40");
    const missed = screen.getByText("Cutoffs missed").nextSibling;
    expect(missed).toHaveTextContent("1");
    expect(missed).toHaveClass("over");
    expect(screen.getByText("Over")).toHaveClass("badge", "over");
    expect(screen.getByText(/Refuge is past its cutoff by 0h15/)).toHaveTextContent(
      "Tightest of the rest: Finish, 0h10.",
    );
  });

  it("dims while the plan is recomputed, and shows nothing before one", () => {
    useStore.setState({ planStatus: "computing" });
    const { unmount } = render(<Verdict />);
    expect(screen.getByRole("region", { name: "Verdict" })).toHaveAttribute("aria-busy", "true");
    unmount();
    useStore.setState({ plan: null });
    const { container } = render(<Verdict />);
    expect(container).toBeEmptyDOMElement();
  });
});
