import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../utils/download.js", () => ({ download: vi.fn() }));

const { download } = await import("../../utils/download.js");
const { default: useStore } = await import("../../store/store.js");
const { readyState } = await import("../../test/fixtures.js");
const { default: Toolbar } = await import("./Toolbar.jsx");

describe("Toolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState(readyState);
  });

  it("downloads plan.json as gpxz wrote it", async () => {
    const exportPlan = vi.fn(async () => ({ name: "race.plan.json", text: "{}\n" }));
    useStore.setState({ exportPlan });
    render(<Toolbar />);
    fireEvent.click(screen.getByRole("button", { name: /Export plan.json/ }));
    await waitFor(() => expect(download).toHaveBeenCalledWith("race.plan.json", "{}\n"));
  });

  it("shows why an export failed", async () => {
    useStore.setState({ exportPlan: vi.fn(async () => Promise.reject(new Error("No plan."))) });
    render(<Toolbar />);
    fireEvent.click(screen.getByRole("button", { name: /Export plan.json/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No plan.");
  });

  it("disables export while the model has an error", () => {
    useStore.setState({ formErrors: { pace: "bad" } });
    render(<Toolbar />);
    expect(screen.getByRole("button", { name: /Export plan.json/ })).toBeDisabled();
  });

  it("shows only the name before a course is open", () => {
    useStore.setState({ status: "idle" });
    render(<Toolbar />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("men")).toBeInTheDocument();
  });
});
