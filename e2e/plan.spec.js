import { expect, test } from "@playwright/test";

import { finishTime, fixtureBytes, fixtureSha256, openCourse, readDownload } from "./helpers.js";

test("a course opens on a plan with a row per checkpoint", async ({ page }) => {
  await openCourse(page);
  const rows = page.getByRole("table").getByRole("row");
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(2).getByRole("rowheader")).toContainText("Refuge");
  await expect(page.getByText("Synthetic 6K")).toBeVisible();
});

test("a slower pace finishes later, and an invalid one is marked", async ({ page }) => {
  await openCourse(page);
  const before = await finishTime(page);
  const pace = page.getByLabel(/Flat pace/);
  await pace.fill("12:00");
  await expect.poll(() => finishTime(page)).not.toBe(before);

  await pace.fill("fast");
  await expect(pace).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("button", { name: /Export plan.json/ })).toBeDisabled();
});

test("plan.json downloads with the model and the course's hash", async ({ page }) => {
  await openCourse(page);
  await page.getByLabel(/LifeBase stop/).fill("15");
  await page.getByLabel(/Flat pace/).fill("7:30");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Export plan.json/ }).click(),
  ]);
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
  await expect(page.getByRole("columnheader", { name: "Refill" })).toHaveCount(0);
  await page.getByRole("checkbox", { name: /Plan what to eat and drink/ }).check();
  await page.getByLabel(/Carbs/).fill("70");

  // gpxz's defaults: the Start full, the Refuge (a time barrier) nothing.
  const start = page.getByRole("combobox", { name: "Refill at Start" });
  const refuge = page.getByRole("combobox", { name: "Refill at Refuge" });
  await expect(start).toHaveValue("full");
  await expect(refuge).toHaveValue("none");
  const rows = page.getByRole("table").getByRole("row");
  await expect(rows.nth(1).getByRole("cell").last()).toContainText(
    /\d+ g · [\d.]+ L · [\d.]+ g Na/,
  );
  await expect(rows.nth(2).getByRole("cell").last()).toHaveText("–");

  await refuge.selectOption("water");
  await expect(refuge).toHaveClass(/changed/);
  await expect(rows.nth(2).getByRole("cell").last()).toHaveText(/^[\d.]+ L$/);
  await expect(page.locator("dt", { hasText: "Carbs" })).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Export plan.json/ }).click(),
  ]);
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
  await expect(page.getByLabel(/Carbs/)).toHaveValue("70");
  await expect(page.getByRole("combobox", { name: "Refill at Refuge" })).toHaveValue("water");
});

test("a saved plan reopens on its course, and asks on another", async ({ page }) => {
  await openCourse(page);
  await page.getByLabel(/Fatigue/).fill("0.01");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Export plan.json/ }).click(),
  ]);
  const saved = { name: "route.plan.json", mimeType: "application/json" };
  saved.buffer = Buffer.from(await readDownload(download));

  // Same course, fresh page: the form takes the plan's model.
  await openCourse(page);
  await expect(page.getByLabel(/Fatigue/)).toHaveValue("0.002");
  await page.getByTestId("plan-input").setInputFiles(saved);
  await expect(page.getByRole("status")).toContainText("Opened route.plan.json");
  await expect(page.getByLabel(/Fatigue/)).toHaveValue("0.01");

  // The course with one byte more: the plan is for another file.
  const edited = {
    name: "edited.gpx",
    mimeType: "application/gpx+xml",
    buffer: Buffer.concat([fixtureBytes, Buffer.from("\n")]),
  };
  await openCourse(page, edited);
  await page.getByTestId("plan-input").setInputFiles(saved);
  await expect(page.getByRole("alert")).toContainText("was made for Synthetic 6K");
  await expect(page.getByLabel(/Fatigue/)).toHaveValue("0.002");
  await page.getByRole("button", { name: "Use its model anyway" }).click();
  await expect(page.getByLabel(/Fatigue/)).toHaveValue("0.01");
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
