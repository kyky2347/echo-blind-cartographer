import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGame, endRunForDebug, useSensor } from "@echo/inference-core";
import type { StoredRun } from "./storage";

let storage: typeof import("./storage");

describe("run storage", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    vi.resetModules();
    storage = await import("./storage");
  });
  afterEach(() => vi.restoreAllMocks());

  it("round-trips a complete deterministic run state", async () => {
    const stored = storage.saveRun(endRunForDebug(useSensor(createGame("TEST-ROUNDTRIP", "signal"), "sonar")));

    vi.resetModules();
    const reloaded = await import("./storage");
    expect(reloaded.loadRun(stored.id)?.seed).toBe("TEST-ROUNDTRIP");
    expect(reloaded.loadRun(stored.id)?.state.frames).toEqual(stored.state.frames);
    expect(reloaded.loadRuns()).toHaveLength(1);
  });

  it("ignores malformed or incomplete local data", () => {
    window.localStorage.setItem("echo-runs-v1", JSON.stringify([
      { id: "broken", state: { frames: "not-an-array" } },
      null,
      "corrupt",
    ]));

    expect(storage.loadRuns()).toEqual([]);
    expect(storage.loadRun("broken")).toBeUndefined();
  });

  it("recovers from invalid JSON", () => {
    window.localStorage.setItem("echo-runs-v1", "{not-json");

    expect(storage.loadRuns()).toEqual([]);
  });

  it.each([
    ["missing hunter entropy", (run: StoredRun) => { delete (run.state.frames[0] as Partial<typeof run.state.frames[0]>).hunterEntropy; }],
    ["invalid score inputs", (run: StoredRun) => { run.state.maxEnergy = 0; }],
    ["malformed particles", (run: StoredRun) => { run.state.frames[0]!.particles = [null as never]; }],
    ["invalid grid size", (run: StoredRun) => { run.state.facility.cells = [1]; }],
    ["invalid objective coordinates", (run: StoredRun) => { run.state.facility.cores[0] = { x: 1000, y: 0 }; }],
    ["missing metrics", (run: StoredRun) => { delete (run.state.metrics as Partial<typeof run.state.metrics>).energyUsed; }],
    ["non-finite chart values", (run: StoredRun) => { run.state.frames[0]!.energy = Number.NaN; }],
    ["invalid likelihood", (run: StoredRun) => { run.state.frames[0]!.likelihood = [null as never]; }],
    ["unknown difficulty", (run: StoredRun) => { run.difficulty = "unknown" as never; }],
  ])("ignores %s while preserving valid neighboring runs", (_, corrupt) => {
    const valid = storage.saveRun(createGame("VALID"));
    const invalid = structuredClone(valid);
    invalid.id = invalid.state.id = "invalid";
    corrupt(invalid);
    window.localStorage.setItem("echo-runs-v1", JSON.stringify([invalid, valid]));
    expect(storage.loadRuns().map((run) => run.id)).toEqual([valid.id]);
  });

  it("keeps the newest 12 runs and replaces duplicate IDs", () => {
    for (let index = 0; index < 13; index += 1) storage.saveRun(createGame(`RUN-${index}`));
    const newest = storage.loadRuns()[0]!;
    storage.saveRun(newest.state);
    expect(storage.loadRuns()).toHaveLength(12);
    expect(storage.loadRuns().some((run) => run.seed === "RUN-0")).toBe(false);
    expect(storage.loadRuns().filter((run) => run.id === newest.id)).toHaveLength(1);
  });

  it("keeps an oversized replay accessible without deleting existing history", () => {
    const old = storage.saveRun(createGame("PERSISTED"));
    const original = window.localStorage.getItem("echo-runs-v1");
    const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Full", "QuotaExceededError"); });
    const recent = storage.saveRun(createGame("SESSION"));
    expect(storage.isRunSessionOnly(recent.id)).toBe(true);
    expect(storage.loadRun(recent.id)?.state).toEqual(recent.state);
    expect(storage.loadRun(old.id)?.seed).toBe("PERSISTED");
    expect(window.localStorage.getItem("echo-runs-v1")).toBe(original);
    set.mockRestore();
    storage.saveRun(recent.state);
    expect(storage.isRunSessionOnly(recent.id)).toBe(false);
  });

  it("supports session replay navigation when all storage access is denied", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
    const run = storage.saveRun(createGame("BLOCKED"));
    expect(storage.loadRun(run.id)?.seed).toBe("BLOCKED");
    expect(storage.isRunSessionOnly(run.id)).toBe(true);
  });

  it("invalidates cached history when another tab changes the stored archive", () => {
    storage.saveRun(createGame("BEFORE"));
    expect(storage.loadRuns()).toHaveLength(1);
    window.localStorage.setItem("echo-runs-v1", "[]");
    expect(storage.loadRuns()).toEqual([]);
  });
});
