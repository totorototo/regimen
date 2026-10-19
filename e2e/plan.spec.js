import { expect, test } from "@playwright/test";

import {
  exportButton,
  finishTime,
  fixtureBytes,
  fixtureSha256,
  openCourse,
  readDownload,
  stepTo,
  value,
} from "./helpers.js";

test("a course opens on its story, a stop per checkpoint", async ({ page }) => {
  await openCourse(page);
  const names = page.getByRole("list", { name: "Checkpoints" }).getByRole("heading");
  await expect(names).toHaveText(["Start", "Refuge", "Finish"]);
  await expect(page.getByRole("heading", { level: 1, name: "Synthetic 6K" })).toBeVisible();
  // The route behind the story is the course's elevation, from gpxz.
  await expect(page.locator(".contour-line")).toHaveAttribute("d", /^M[\d.]+,0\.0L/);
});

test("a slower pace finishes later", async ({ page }) => {
  await openCourse(page);
  const before = await finishTime(page);
  await stepTo(page, "Flat pace", "9:00", 1);
  await expect(value(page, "Flat pace")).toHaveText("9:00 min/km");
  await expect.poll(() => finishTime(page)).not.toBe(before);
});

test("plan.json downloads with the model and the course's hash", async ({ page }) => {
  await openCourse(page);
  await stepTo(page, "LifeBase stop", "15", -1);
  await stepTo(page, "Flat pace", "7:30", -1);
  const [download] = await Promise.all([page.waitForEvent("download"), exportButton(page).click()]);
  expect(download.suggestedFilename()).toBe("route.plan.json");
  const text = await readDownload(download);
  const plan = JSON.parse(text);
  expect(plan.schema_version).toBe(2);
  expect(plan.course.sha256).toBe(fixtureSha256);
  expect(plan.model).toEqual({
    pace_base_s_per_km: 450,
    fatigue_coefficient: 0.002,
    life_base_stop_s: 900,
    fueling: null,
  });
  expect(plan.carry).toEqual([]);
  expect(plan.entries.map((entry) => entry.name)).toEqual(["Start", "Refuge", "Finish"]);
});

test("fueling: targets, a refill changed per checkpoint, and what to leave with", async ({
  page,
}) => {
  await openCourse(page);
  await expect(page.getByRole("group", { name: /Refill/ })).toHaveCount(0);
  await page.getByRole("button", { name: /^Fueling/ }).click();
  await stepTo(page, "Carbs", "70", 1);

  // gpxz's defaults: the Start full, the Refuge (a time barrier) nothing.
  const start = page.getByRole("group", { name: "Refill at Start" });
  const refuge = page.getByRole("group", { name: "Refill at Refuge" });
  const supply = (group, name) => group.getByRole("button", { name, exact: true });
  await expect(supply(start, "Full")).toHaveAttribute("aria-pressed", "true");
  await expect(supply(refuge, "None")).toHaveAttribute("aria-pressed", "true");
  const leaveWith = (index) =>
    page
      .getByRole("list", { name: "Checkpoints" })
      .getByRole("listitem")
      .nth(index)
      .locator(".carry");
  await expect(leaveWith(0)).toHaveText(/Leave with \d+ g · [\d.]+ L · [\d.]+ g Na/);
  await expect(leaveWith(1)).toHaveCount(0);

  await supply(refuge, "Water").click();
  await expect(supply(refuge, "Water")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("was none")).toBeVisible();
  await expect(leaveWith(1)).toHaveText(/^Leave with [\d.]+ L$/);
  await expect(page.getByText("Whole race")).toBeVisible();

  const [download] = await Promise.all([page.waitForEvent("download"), exportButton(page).click()]);
  const text = await readDownload(download);
  const plan = JSON.parse(text);
  expect(plan.model.fueling).toMatchObject({
    carbs_g_per_h: 70,
    supplies: ["full", "water", "none"],
  });
  expect(plan.carry).toHaveLength(3);
  expect(plan.carry[1]).toMatchObject({ carbs_g: null, sodium_mg: null });

  // Reopened on a fresh page: fueling and the chosen refill come back.
  const saved = { name: "route.plan.json", mimeType: "application/json" };
  saved.buffer = Buffer.from(text);
  await openCourse(page);
  await page.getByTestId("plan-input").setInputFiles(saved);
  await expect(value(page, "Carbs")).toHaveText("70 g/h");
  await expect(
    page.getByRole("group", { name: "Refill at Refuge" }).getByRole("button", { name: "Water" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("a saved plan reopens on its course, and asks on another", async ({ page }) => {
  await openCourse(page);
  await stepTo(page, "Fatigue", "0.01", 1);
  const [download] = await Promise.all([page.waitForEvent("download"), exportButton(page).click()]);
  const saved = { name: "route.plan.json", mimeType: "application/json" };
  saved.buffer = Buffer.from(await readDownload(download));

  // Same course, fresh page: the form takes the plan's model.
  await openCourse(page);
  await expect(value(page, "Fatigue")).toHaveText("0.002 /km");
  await page.getByTestId("plan-input").setInputFiles(saved);
  await expect(page.getByRole("status").filter({ hasText: "Opened" })).toContainText(
    "Opened route.plan.json",
  );
  await expect(value(page, "Fatigue")).toHaveText("0.01 /km");

  // The course with one byte more: the plan is for another file.
  const edited = {
    name: "edited.gpx",
    mimeType: "application/gpx+xml",
    buffer: Buffer.concat([fixtureBytes, Buffer.from("\n")]),
  };
  await openCourse(page, edited);
  await page.getByTestId("plan-input").setInputFiles(saved);
  await expect(page.getByRole("alert")).toContainText("was made for Synthetic 6K");
  await expect(value(page, "Fatigue")).toHaveText("0.002 /km");
  await page.getByRole("button", { name: "Use its model anyway" }).click();
  await expect(value(page, "Fatigue")).toHaveText("0.01 /km");
});

test("a file that is not a plan is explained, not applied", async ({ page }) => {
  await openCourse(page);
  await page.getByTestId("plan-input").setInputFiles({
    name: "notes.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"schema_version": 1, "hello": true}'),
  });
  await expect(page.getByRole("alert")).toContainText("notes.json could not be read");
});

test("a GPX without checkpoints says to go through Waymark", async ({ page }) => {
  await page.goto("/");
  const bare = fixtureBytes.toString("utf8").replace(/<wpt[\s\S]*?<\/wpt>\s*/g, "");
  await page.getByTestId("course-input").setInputFiles({
    name: "bare.gpx",
    mimeType: "application/gpx+xml",
    buffer: Buffer.from(bare),
  });
  await expect(page.getByRole("alert")).toContainText("pin the checkpoints");
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the verdict comes first, then the model as steppers", async ({ page }) => {
    await openCourse(page);
    const verdict = await page.getByRole("region", { name: "Verdict" }).boundingBox();
    const model = await page.getByRole("heading", { name: "Your model" }).boundingBox();
    expect(verdict.y).toBeLessThan(model.y);

    const before = await finishTime(page);
    // Six steps of 5 s/km on the 6 km fixture: about 3 min, enough to show in the finish.
    const plus = page.getByRole("button", { name: "Increase Flat pace" });
    for (let i = 0; i < 6; i += 1) await plus.click();
    await expect(value(page, "Flat pace")).toHaveText("8:50 min/km");
    await expect.poll(() => finishTime(page)).not.toBe(before);
    // Each step button is the suite's 44px target, beside the value.
    const target = await page.getByRole("button", { name: "Increase Fatigue" }).boundingBox();
    expect(target.width).toBeGreaterThanOrEqual(44);
    expect(target.height).toBeGreaterThanOrEqual(44);

    // One row of masthead: the brand and Export; the files wait in the story's last section.
    const banner = await page.getByRole("banner").boundingBox();
    expect(banner.height).toBeLessThan(100);
    await expect(exportButton(page)).toBeVisible();
    await expect(page.getByRole("banner").getByRole("button", { name: /Open GPX/ })).toBeHidden();
    await expect(page.getByRole("button", { name: "Open another GPX" })).toBeAttached();
    // The finish time is in the top half of the first screen.
    const finish = await page.locator(".stat.hero").boundingBox();
    expect(finish.y).toBeLessThan(844 / 2);
  });
});
