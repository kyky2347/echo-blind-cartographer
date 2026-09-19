"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createGame, movePlayer, useSensor, type Difficulty, type Direction, type GameState, type SensorKind } from "@echo/inference-core";

type GameStore = {
  game: GameState | null;
  introSeen: boolean;
  tutorialStep: number;
  muted: boolean;
  reduceParticles: boolean;
  highContrast: boolean;
  lastUpdateMs: number;
  start: (seed: string, difficulty: Difficulty) => void;
  restore: (state: GameState) => void;
  move: (direction: Direction) => void;
  scan: (sensor: SensorKind) => void;
  setTutorialStep: (step: number) => void;
  setIntroSeen: (seen: boolean) => void;
  setMuted: (muted: boolean) => void;
  setReduceParticles: (reduced: boolean) => void;
  setHighContrast: (value: boolean) => void;
};

export const useGameStore = create<GameStore>()(persist((set) => ({
  game: null,
  introSeen: false,
  tutorialStep: 0,
  muted: false,
  reduceParticles: false,
  highContrast: false,
  lastUpdateMs: 0,
  start: (seed, difficulty) => set({ game: createGame(seed, difficulty), tutorialStep: 0 }),
  restore: (game) => set({ game }),
  move: (direction) => set((state) => {
    const started = performance.now();
    const game = state.game ? movePlayer(state.game, direction) : null;
    return { game, lastUpdateMs: performance.now() - started };
  }),
  scan: (sensor) => set((state) => {
    const started = performance.now();
    const game = state.game ? useSensor(state.game, sensor) : null;
    return { game, lastUpdateMs: performance.now() - started };
  }),
  setTutorialStep: (tutorialStep) => set({ tutorialStep }),
  setIntroSeen: (introSeen) => set({ introSeen }),
  setMuted: (muted) => set({ muted }),
  setReduceParticles: (reduceParticles) => set({ reduceParticles }),
  setHighContrast: (highContrast) => set({ highContrast }),
}), {
  name: "echo-preferences-v1",
  storage: createJSONStorage(() => ({
    getItem: (key) => { try { return window.localStorage.getItem(key); } catch { return null; } },
    setItem: (key, value) => { try { window.localStorage.setItem(key, value); } catch { /* Session preferences still work. */ } },
    removeItem: (key) => { try { window.localStorage.removeItem(key); } catch { /* Storage may be disabled. */ } },
  })),
  merge: (persisted, current) => {
    if (typeof persisted !== "object" || persisted === null) return current;
    const preferences = persisted as Record<string, unknown>;
    const valid: Partial<GameStore> = {};
    for (const key of ["introSeen", "muted", "reduceParticles", "highContrast"] as const) {
      if (typeof preferences[key] === "boolean") valid[key] = preferences[key];
    }
    return { ...current, ...valid };
  },
  partialize: (state) => ({
    introSeen: state.introSeen,
    muted: state.muted,
    reduceParticles: state.reduceParticles,
    highContrast: state.highContrast,
  }),
}));
