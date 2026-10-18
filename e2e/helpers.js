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
  await page.getByRole("region", { name: "Plan" }).getByRole("listitem").first().waitFor();
}

export const finishTime = (page) =>
  page.locator("dt", { hasText: "Finish" }).locator("xpath=following-sibling::dd").textContent();
