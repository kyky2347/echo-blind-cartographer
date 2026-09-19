import { vi, afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, render as renderView, screen as ui } from "@testing-library/react";
import { createGame, projectPlayState } from "@echo/inference-core";
import { I18nProvider } from "@/lib/i18n";
import { BeliefCanvas, XRayCanvas } from "./belief-canvas";

const pixi = vi.hoisted(() => ({ apps: [] as MockApp[], init: (() => Promise.resolve()) as () => Promise<void> }));
type MockApp = {
  init: ReturnType<typeof vi.fn>;
  render: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  ticker: { add: ReturnType<typeof vi.fn>; maxFPS: number };
  canvas: HTMLCanvasElement;
};
vi.mock("pixi.js", () => ({
  Application: class {
    canvas = document.createElement("canvas");
    screen = { width: 800, height: 600 };
    renderer = { resize: vi.fn((width: number, height: number) => { this.screen = { width, height }; }) };
    stage = { addChild: vi.fn() };
    ticker = { add: vi.fn(), maxFPS: 60 };
    start = vi.fn();
    stop = vi.fn();
    render = vi.fn();
    destroy = vi.fn();
    init = vi.fn(() => pixi.init());
    constructor() { pixi.apps.push(this); }
  },
  Graphics: class {
    clear() { return this; }
    rect() { return this; }
    circle() { return this; }
    fill() { return this; }
    stroke() { return this; }
  },
}));

describe("canvas lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pixi.apps.length = 0;
    pixi.init = vi.fn(() => Promise.resolve());
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 16));
    vi.stubGlobal("cancelAnimationFrame", window.clearTimeout.bind(window));
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("renders paused X-Ray once, idles, and redraws on a new frame without recreating WebGL", async () => {
    const game = createGame("CANVAS-IDLE");
    const frame = game.frames[0]!;
    const view = renderView(<I18nProvider><XRayCanvas facility={game.facility} frame={frame} /></I18nProvider>);
    await act(async () => { await vi.advanceTimersByTimeAsync(32); });
    const app = pixi.apps[0]!;
    expect(app.init).toHaveBeenCalledWith(expect.objectContaining({ autoStart: false }));
    expect(app.render).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(app.render).toHaveBeenCalledTimes(1);
    expect(app.ticker.add).not.toHaveBeenCalled();
    view.rerender(<I18nProvider><XRayCanvas facility={game.facility} frame={{ ...frame, tick: 1 }} /></I18nProvider>);
    await act(async () => { await vi.advanceTimersByTimeAsync(32); });
    expect(pixi.apps).toHaveLength(1);
    expect(app.render).toHaveBeenCalledTimes(2);
    view.unmount();
    expect(app.destroy).toHaveBeenCalledTimes(1);
  });

  it.each(["play", "replay"])("safely unmounts %s while the renderer is still initializing", async (mode) => {
    let resolveInit!: () => void;
    pixi.init = () => new Promise<void>((resolve) => { resolveInit = resolve; });
    const game = createGame("CANVAS-UNMOUNT");
    const view = renderView(<I18nProvider>{mode === "play"
      ? <BeliefCanvas projection={projectPlayState(game)} reduceParticles={false} />
      : <XRayCanvas facility={game.facility} frame={game.frames[0]!} />}</I18nProvider>);
    await act(async () => {});
    const app = pixi.apps[0]!;
    view.unmount();
    expect(app.destroy).not.toHaveBeenCalled();
    await act(async () => resolveInit());
    expect(app.destroy).toHaveBeenCalledTimes(1);
    expect(app.canvas.isConnected).toBe(false);
  });

  it("defers hidden-tab changes and coalesces them into one redraw on return", async () => {
    const game = createGame("CANVAS-HIDDEN");
    const frame = game.frames[0]!;
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    const view = renderView(<I18nProvider><XRayCanvas facility={game.facility} frame={frame} /></I18nProvider>);
    await act(async () => { await vi.advanceTimersByTimeAsync(32); });
    const app = pixi.apps[0]!;
    hidden.mockReturnValue(true);
    view.rerender(<I18nProvider><XRayCanvas facility={game.facility} frame={{ ...frame, tick: 1 }} /></I18nProvider>);
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(app.render).toHaveBeenCalledTimes(1);
    hidden.mockReturnValue(false);
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      document.dispatchEvent(new Event("visibilitychange"));
      await vi.advanceTimersByTimeAsync(32);
    });
    expect(app.render).toHaveBeenCalledTimes(2);
  });

  it("shows a recoverable error when graphics initialization fails", async () => {
    pixi.init = vi.fn<() => Promise<void>>().mockRejectedValueOnce(new Error("GPU unavailable")).mockResolvedValue();
    const game = createGame("CANVAS-ERROR");
    renderView(<I18nProvider><XRayCanvas facility={game.facility} frame={game.frames[0]!} /></I18nProvider>);
    await act(async () => {});
    expect(ui.getByText(/The map could not start/)).toBeInTheDocument();
    await act(async () => ui.getByRole("button", { name: "Retry map" }).click());
    await act(async () => { await vi.advanceTimersByTimeAsync(32); });
    expect(ui.queryByText(/The map could not start/)).not.toBeInTheDocument();
    expect(pixi.apps[1]!.render).toHaveBeenCalledTimes(1);
  });
});
