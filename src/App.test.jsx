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
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/paced and timed/);
    expect(screen.getByRole("button", { name: /Open GPX/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Export/ })).not.toBeInTheDocument();
  });

  it("says what to do about a course gpxz refused", () => {
    useStore.setState({ status: "error", error: "Checkpoints too few" });
    render(<ThemedApp />);
    expect(screen.getByRole("alert")).toHaveTextContent(/pin the checkpoints/);
    expect(screen.getByText("gpxz said: Checkpoints too few")).toBeInTheDocument();
  });

  it("shows the model beside the plan once a course is open", () => {
    useStore.setState(readyState);
    render(<ThemedApp />);
    expect(screen.getByLabelText(/Flat pace/)).toHaveValue("8:20");
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export plan.json/ })).toBeEnabled();
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
