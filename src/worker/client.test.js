import { describe, expect, it, vi } from "vitest";

import { createWorkerClientFor } from "./client.js";

function fakeWorker() {
  const worker = { posted: [], terminate: vi.fn() };
  worker.postMessage = (message, transfer) => worker.posted.push({ message, transfer });
  return worker;
}

describe("createWorkerClientFor", () => {
  it("resolves a request with its own result", async () => {
    const worker = fakeWorker();
    const client = createWorkerClientFor(worker);
    const first = client.buildPlan({ pace_base_s_per_km: 400 });
    const second = client.buildPlan({ pace_base_s_per_km: 500 });
    const [one, two] = worker.posted.map(({ message }) => message);
    expect(one).toEqual({
      id: 0,
      type: "buildPlan",
      payload: { settings: { pace_base_s_per_km: 400 } },
    });
    worker.onmessage({ data: { id: two.id, result: "second" } });
    worker.onmessage({ data: { id: one.id, result: "first" } });
    await expect(first).resolves.toBe("first");
    await expect(second).resolves.toBe("second");
  });

  it("rejects with the worker's error", async () => {
    const worker = fakeWorker();
    const request = createWorkerClientFor(worker).buildPlan({});
    worker.onmessage({ data: { id: 0, error: "SettingsInvalid" } });
    await expect(request).rejects.toThrow("SettingsInvalid");
  });

  it("transfers a file's buffer, and a model's nothing", () => {
    const worker = fakeWorker();
    const client = createWorkerClientFor(worker);
    const course = new ArrayBuffer(8);
    const plan = new ArrayBuffer(4);
    client.loadCourse(course, { life_base_stop_s: 0 });
    client.buildPlan({});
    client.openPlan(plan);
    expect(worker.posted[0].transfer).toEqual([course]);
    expect(worker.posted[0].message.payload.settings).toEqual({ life_base_stop_s: 0 });
    expect(worker.posted[1].transfer).toEqual([]);
    expect(worker.posted[2].transfer).toEqual([plan]);
  });

  it("ignores an answer to nothing", () => {
    const worker = fakeWorker();
    createWorkerClientFor(worker);
    expect(() => worker.onmessage({ data: { id: 99, result: 1 } })).not.toThrow();
  });

  it("rejects every pending request when the worker fails", async () => {
    const worker = fakeWorker();
    const client = createWorkerClientFor(worker);
    const first = client.buildPlan({});
    const second = client.buildPlan({});
    worker.onerror({ message: "boom" });
    await expect(first).rejects.toThrow("boom");
    await expect(second).rejects.toThrow("boom");
  });

  it("terminates the worker", () => {
    const worker = fakeWorker();
    createWorkerClientFor(worker).terminate();
    expect(worker.terminate).toHaveBeenCalled();
  });
});
