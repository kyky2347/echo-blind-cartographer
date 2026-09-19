import type { GameState, Position } from "@echo/inference-core";
import { scoreRun } from "@echo/inference-core";

export type StoredRun = {
  id: string;
  seed: string;
  result: GameState["result"];
  difficulty: GameState["difficulty"];
  savedAt: number;
  score: number;
  duration: number;
  informationEfficiency: number;
  state: GameState;
};

const KEY = "echo-runs-v1";
const sessionRuns = new Map<string, StoredRun>();
let cachedRaw: string | null = null;
let cachedRuns: StoredRun[] = [];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPosition(value: unknown): value is Position {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isFiniteNumber);
}

function isParticles(value: unknown) {
  return Array.isArray(value) && value.length > 0 && value.every((particle) =>
    isRecord(particle) && isFiniteNumber(particle.weight) && particle.weight >= 0 && isPosition(particle));
}

function isDifficulty(value: unknown) {
  return value === "explorer" || value === "signal" || value === "dark";
}

function isResult(value: unknown) {
  return value === "active" || value === "survived" || value === "lost-contact" || value === "lost-energy";
}

function isHunterMode(value: unknown) {
  return typeof value === "string" && ["quiet", "disturbance", "searching", "hunting", "contact"].includes(value);
}

function isStoredRun(value: unknown): value is StoredRun {
  if (!isRecord(value) || !isRecord(value.state)) return false;
  const state = value.state;
  const facility = state.facility;
  const frames = state.frames;
  const metrics = state.metrics;
  const belief = state.belief;
  const truth = state.truth;
  if (!isRecord(facility) || !Number.isInteger(facility.width) || !Number.isInteger(facility.height)
    || !isFiniteNumber(facility.width) || !isFiniteNumber(facility.height)
    || facility.width <= 0 || facility.height <= 0 || facility.width > 256 || facility.height > 256) return false;
  const { width, height } = facility;
  const cells = width * height;
  const isGrid = (grid: unknown): grid is number[] => isNumberArray(grid) && grid.length === cells;
  const onMap = (position: unknown) => isPosition(position)
    && position.x >= 0 && position.x < width && position.y >= 0 && position.y < height;
  const positions = (items: unknown): items is Position[] => Array.isArray(items) && items.every(onMap);
  return typeof value.id === "string"
    && value.id === state.id
    && typeof value.seed === "string"
    && value.seed === state.seed
    && isDifficulty(value.difficulty) && value.difficulty === state.difficulty
    && isResult(value.result) && value.result === state.result
    && isFiniteNumber(value.savedAt)
    && isFiniteNumber(value.score)
    && isFiniteNumber(value.duration)
    && isFiniteNumber(value.informationEfficiency)
    && typeof state.seed === "string"
    && isGrid(facility.cells)
    && facility.cells.every((cell) => cell === 0 || cell === 1)
    && positions(facility.cores) && positions(facility.beacons) && positions(facility.recharge)
    && onMap(facility.start) && onMap(facility.hunterStart) && onMap(facility.extraction)
    && isRecord(truth) && onMap(truth.player) && onMap(truth.hunter)
    && Array.isArray(truth.collected) && truth.collected.every((item) => typeof item === "boolean")
    && truth.collected.length === facility.cores.length && typeof truth.extractionRevealed === "boolean"
    && isFiniteNumber(state.energy) && isFiniteNumber(state.maxEnergy) && state.maxEnergy > 0
    && isFiniteNumber(state.tick) && isFiniteNumber(state.signature)
    && isHunterMode(state.hunterMode) && onMap(state.hunterTarget) && isGrid(state.hunterBelief)
    && isRecord(metrics)
    && ["moves", "scans", "energyUsed", "informationGain", "signatureGenerated", "contactEvents", "startedAt"].every((key) => isFiniteNumber(metrics[key]))
    && (metrics.endedAt === undefined || isFiniteNumber(metrics.endedAt))
    && isNumberArray(metrics.entropySamples)
    && isRecord(belief)
    && isFiniteNumber(belief.entropy) && isFiniteNumber(belief.ess)
    && isParticles(belief.particles) && isGrid(belief.memory)
    && (belief.lastLikelihood === undefined || isGrid(belief.lastLikelihood))
    && Array.isArray(frames)
    && frames.length > 0
    && frames.every((frame) => isRecord(frame)
      && typeof frame.action === "string"
      && isFiniteNumber(frame.entropy)
      && isFiniteNumber(frame.signature)
      && ["tick", "hunterEntropy", "energy", "informationGain", "cores"].every((key) => isFiniteNumber(frame[key]))
      && isHunterMode(frame.hunterMode)
      && onMap(frame.player) && onMap(frame.hunter) && onMap(frame.beliefMean)
      && isParticles(frame.particles)
      && isGrid(frame.hunterBelief)
      && (frame.likelihood === undefined || isGrid(frame.likelihood)));
}

function loadPersistedRuns(): StoredRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY) ?? "[]";
    if (raw === cachedRaw) return cachedRuns;
    const parsed: unknown = JSON.parse(raw);
    cachedRuns = Array.isArray(parsed) ? parsed.filter(isStoredRun).slice(0, 12) : [];
    cachedRaw = raw;
    return cachedRuns;
  } catch {
    return [];
  }
}

export function loadRuns(): StoredRun[] {
  const persisted = loadPersistedRuns();
  return [...sessionRuns.values(), ...persisted.filter((run) => !sessionRuns.has(run.id))]
    .sort((a, b) => b.savedAt - a.savedAt).slice(0, 12);
}

export function isRunSessionOnly(id: string): boolean {
  return sessionRuns.has(id);
}

export function saveRun(state: GameState): StoredRun {
  const run: StoredRun = {
    id: state.id,
    seed: state.seed,
    result: state.result,
    difficulty: state.difficulty,
    savedAt: Date.now(),
    score: scoreRun(state).total,
    duration: Math.max(0, Math.round(((state.metrics.endedAt ?? Date.now()) - state.metrics.startedAt) / 1000)),
    informationEfficiency: state.metrics.informationGain / Math.max(1, state.metrics.signatureGenerated),
    state,
  };
  try {
    const others = loadPersistedRuns().filter((item) => item.id !== run.id).slice(0, 11);
    const runs = [run, ...others];
    const raw = JSON.stringify(runs);
    window.localStorage.setItem(KEY, raw);
    cachedRaw = raw;
    cachedRuns = runs;
    sessionRuns.delete(run.id);
  } catch {
    // Keep existing persistent history intact when a new replay exceeds quota.
    // The session fallback is shared by Debrief, History, and X-Ray navigation.
    sessionRuns.delete(run.id);
    sessionRuns.set(run.id, run);
    if (sessionRuns.size > 12) sessionRuns.delete(sessionRuns.keys().next().value!);
  }
  return run;
}

export function loadRun(id: string): StoredRun | undefined {
  return loadRuns().find((run) => run.id === id);
}
