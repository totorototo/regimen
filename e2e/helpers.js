import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// The synthetic 6 km race (Start, Refuge, Finish), run through the real WASM module.
export const fixture = fileURLToPath(new URL("../zig/testdata/route.gpx", import.meta.url));
export const fixtureBytes = readFileSync(fixture);
export const fixtureSha256 = createHash("sha256").update(fixtureBytes).digest("hex");

export async function readDownload(download) {
  const chunks = [];
  for await (const chunk of await download.createReadStream()) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

export async function openCourse(page, file = fixture) {
  await page.goto("/");
  await page.getByTestId("course-input").setInputFiles(file);
  await page.getByRole("list", { name: "Checkpoints" }).getByRole("listitem").first().waitFor();
}

// One input of the model, its stepper's value as text: "8:20 min/km".
export const value = (page, label) =>
  page.getByRole("group", { name: label, exact: true }).locator("output");

// Steps a stepper to `target` (its value without the unit), one tap at a time.
export async function stepTo(page, label, target, direction) {
  const button = page.getByRole("button", {
    name: `${direction > 0 ? "Increase" : "Decrease"} ${label}`,
  });
  for (let taps = 0; taps < 40; taps += 1) {
    const text = await value(page, label).textContent();
    if (text.split(" ")[0] === target) return;
    await button.click();
  }
  throw new Error(`${label} never reached ${target}`);
}

// The masthead's Export (the story ends with the same button).
export const exportButton = (page) =>
  page.getByRole("banner").getByRole("button", { name: /Export plan.json/ });

export const finishTime = (page) =>
  page.locator("dt", { hasText: "Finish" }).locator("xpath=following-sibling::dd").textContent();
