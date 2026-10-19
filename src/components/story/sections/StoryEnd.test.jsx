import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../utils/download.js", () => ({ download: vi.fn() }));

const { download } = await import("../../../utils/download.js");
const { default: useStore } = await import("../../../store/store.js");
const { readyState } = await import("../../../test/fixtures.js");
const { default: StoryEnd } = await import("./StoryEnd.jsx");

describe("StoryEnd", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState(readyState);
  });

  it("names the file and exports plan.json as gpxz wrote it", async () => {
    useStore.setState({ exportPlan: vi.fn(async () => ({ name: "r.plan.json", text: "{}\n" })) });
    render(<StoryEnd />);
    expect(screen.getByText(/synthetic.plan.json carries this model/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Export plan.json/ }));
    await waitFor(() => expect(download).toHaveBeenCalledWith("r.plan.json", "{}\n"));
  });

  it("asks before it resets the model", () => {
    const resetSettings = vi.fn();
    useStore.setState({ resetSettings });
    render(<StoryEnd />);
    fireEvent.click(screen.getByRole("button", { name: /Reset the model/ }));
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(resetSettings).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Reset the model/ }));
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(resetSettings).toHaveBeenCalledTimes(1);
  });

  it("flips the theme", () => {
    const toggleTheme = vi.fn();
    useStore.setState({ theme: "dark", toggleTheme });
    render(<StoryEnd />);
    fireEvent.click(screen.getByRole("button", { name: /Light mode/ }));
    expect(toggleTheme).toHaveBeenCalled();
  });
});
