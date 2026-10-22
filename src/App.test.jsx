import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import App, { droppedKind } from "./App.jsx";
import useStore from "./store/store.js";
import { readyState } from "./test/fixtures.js";
import ThemedApp from "./ThemedApp.jsx";

const initial = useStore.getState();

describe("App", () => {
  beforeEach(() => useStore.setState(initial, true));

  it("starts on the page that asks for a course", () => {
    render(<ThemedApp />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("regimen");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(/paced and timed/);
    expect(screen.getByRole("button", { name: /Open GPX/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Export/ })).not.toBeInTheDocument();
  });

  it("says what to do about a course gpxz refused", () => {
    useStore.setState({ status: "error", error: "Checkpoints too few" });
    render(<ThemedApp />);
    expect(screen.getByRole("alert")).toHaveTextContent(/pin the checkpoints/);
    expect(screen.getByText("gpxz said: Checkpoints too few")).toBeInTheDocument();
  });

  it("tells the plan as a story once a course is open", () => {
    useStore.setState(readyState);
    render(<ThemedApp />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Synthetic 6K");
    expect(screen.getByRole("region", { name: "Verdict" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Checkpoints" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Take it to the start line" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Story sections" })).toBeInTheDocument();
    // In the masthead and at the end of the story.
    for (const button of screen.getAllByRole("button", { name: /Export plan.json/ })) {
      expect(button).toBeEnabled();
    }
  });

  it("puts the model right under the verdict, as steppers", () => {
    useStore.setState(readyState);
    render(<ThemedApp />);
    const verdict = screen.getByRole("region", { name: "Verdict" });
    const model = screen.getByRole("heading", { name: "Your model" });
    expect(verdict.compareDocumentPosition(model) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("button", { name: "Increase Flat pace" })).toBeInTheDocument();
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  it("renders without the theme provider's help in tests", () => {
    useStore.setState(readyState);
    const { container } = render(<App />);
    expect(container.querySelector("main")).not.toBeNull();
  });
});

describe("droppedKind", () => {
  it("tells a course from a plan by its name", () => {
    expect(droppedKind({ name: "race.GPX" })).toBe("course");
    expect(droppedKind({ name: "race.plan.json" })).toBe("plan");
    expect(droppedKind({ name: "photo.jpg" })).toBeNull();
  });
});
