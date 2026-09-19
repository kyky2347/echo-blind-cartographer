"use client";

import { useEffect, useRef, useState } from "react";
import type { Application, Graphics } from "pixi.js";
import type { Facility, GameState, PlayProjection, ReplayFrame } from "@echo/inference-core";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

type DebugLayer = Pick<GameState, "facility" | "truth" | "belief" | "hunterBelief" | "hunterTarget">;
type RenderPerformance = { fps: number; renderMs: number };

type BeliefCanvasProps = {
  projection: PlayProjection;
  reduceParticles: boolean;
  debug?: DebugLayer;
  onPerformance?: (value: RenderPerformance) => void;
};

export function BeliefCanvas({ projection, reduceParticles, debug, onPerformance }: BeliefCanvasProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const hostRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ projection, reduceParticles, debug, onPerformance });
  const redrawRef = useRef<(() => void) | null>(null);
  propsRef.current = { projection, reduceParticles, debug, onPerformance };

  useEffect(() => redrawRef.current?.(), [projection, reduceParticles, debug]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let app: Application | null = null;
    let initialized = false;
    let field: Graphics | null = null;
    let pulse: Graphics | null = null;
    let renderedWidth = 0;
    let renderedHeight = 0;
    let renderedProjection: PlayProjection | null = null;
    let renderedDebug: DebugLayer | undefined;
    let renderedReduced = false;
    let pulseStarted = 0;
    let sampleStarted = performance.now();
    let sampleFrames = 0;
    let renderTotal = 0;
    let visibilityCleanup = () => {};
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const drawField = () => {
      if (!app || !field) return;
      const current = propsRef.current;
      const currentProjection = current.projection;
      const currentDebug = current.debug;
      const width = app.screen.width;
      const height = app.screen.height;
      const scale = Math.min(width / currentProjection.width, height / currentProjection.height) * 0.83;
      const offsetX = (width - currentProjection.width * scale) / 2;
      const offsetY = (height - currentProjection.height * scale) / 2;
      field.clear();
      field.rect(0, 0, width, height).fill({ color: 0x030708, alpha: 0.56 });

      if (currentDebug) {
        for (let y = 0; y < currentDebug.facility.height; y += 1) {
          for (let x = 0; x < currentDebug.facility.width; x += 1) {
            if (currentDebug.facility.cells[y * currentDebug.facility.width + x] === 1) {
              field.rect(offsetX + x * scale, offsetY + y * scale, Math.max(1, scale), Math.max(1, scale)).fill({ color: 0x28423d, alpha: 0.48 });
            }
          }
        }
        currentDebug.belief.lastLikelihood?.forEach((value, index) => {
          if (value < 0.02) return;
          const x = index % currentDebug.facility.width;
          const y = Math.floor(index / currentDebug.facility.width);
          field?.rect(offsetX + x * scale, offsetY + y * scale, scale, scale).fill({ color: 0x7f95ff, alpha: Math.min(0.42, value * 0.38) });
        });
        currentDebug.hunterBelief.forEach((value, index) => {
          if (value < 0.0015) return;
          const x = index % currentDebug.facility.width;
          const y = Math.floor(index / currentDebug.facility.width);
          field?.rect(offsetX + x * scale, offsetY + y * scale, scale, scale).fill({ color: 0xe25b54, alpha: Math.min(0.65, value * 24) });
        });
      } else {
        currentProjection.memory.forEach((value, index) => {
          if (Math.abs(value) < 0.08) return;
          const x = index % currentProjection.width;
          const y = Math.floor(index / currentProjection.width);
          if (value > 0) field?.rect(offsetX + x * scale, offsetY + y * scale, Math.max(1, scale), Math.max(1, scale)).fill({ color: 0x76d8c7, alpha: Math.min(0.28, value * 0.24) });
          else field?.rect(offsetX + x * scale, offsetY + y * scale, Math.max(1, scale), Math.max(1, scale)).fill({ color: 0x8ab7af, alpha: Math.min(0.72, Math.abs(value) * 0.64) });
        });
      }

      const stride = current.reduceParticles ? Math.max(1, Math.floor(currentProjection.particles.length / 180)) : Math.max(1, Math.floor(currentProjection.particles.length / 650));
      currentProjection.particles.forEach((particle, index) => {
        if (index % stride !== 0) return;
        const alpha = Math.min(0.72, 0.17 + particle.weight * currentProjection.particles.length * 0.08);
        field?.circle(offsetX + (particle.x + 0.5) * scale, offsetY + (particle.y + 0.5) * scale, current.reduceParticles ? 1 : 1.35).fill({ color: 0x82ead6, alpha });
      });

      if (currentDebug) {
        field.circle(offsetX + (currentDebug.truth.player.x + 0.5) * scale, offsetY + (currentDebug.truth.player.y + 0.5) * scale, 4).fill({ color: 0xf5fff9, alpha: 1 });
        field.circle(offsetX + (currentDebug.truth.hunter.x + 0.5) * scale, offsetY + (currentDebug.truth.hunter.y + 0.5) * scale, 4).fill({ color: 0xff655e, alpha: 1 });
        field.circle(offsetX + (currentDebug.hunterTarget.x + 0.5) * scale, offsetY + (currentDebug.hunterTarget.y + 0.5) * scale, 6).stroke({ color: 0xff655e, width: 1, alpha: 0.8 });
      }

      renderedWidth = width;
      renderedHeight = height;
      if (currentProjection.lastAction === "sensor:sonar" && currentProjection !== renderedProjection) pulseStarted = performance.now();
      renderedProjection = currentProjection;
      renderedDebug = currentDebug;
      renderedReduced = current.reduceParticles;
    };

    const drawPulse = (now: number) => {
      if (!app || !pulse) return;
      const current = propsRef.current;
      pulse.clear();
      const elapsed = now - pulseStarted;
      if (current.reduceParticles || reducedMotion.matches || current.projection.lastAction !== "sensor:sonar" || elapsed > 1400) return;
      const progress = elapsed / 1400;
      const radius = Math.min(app.screen.width, app.screen.height) * 0.48 * progress;
      pulse.circle(app.screen.width / 2, app.screen.height / 2, radius).stroke({ color: 0x79ddcb, width: 1.5, alpha: 0.65 * (1 - progress) });
      pulse.circle(app.screen.width / 2, app.screen.height / 2, radius * 0.72).stroke({ color: 0xe35d55, width: 1, alpha: 0.32 * (1 - progress) });
    };

    const boot = async () => {
      const PIXI = await import("pixi.js");
      if (disposed) return;
      app = new PIXI.Application();
      await app.init({ resizeTo: host, backgroundAlpha: 0, antialias: true, resolution: Math.min(window.devicePixelRatio, 2), autoDensity: true });
      initialized = true;
      if (disposed) {
        app.destroy(true);
        return;
      }
      host.appendChild(app.canvas);
      setStatus("ready");
      field = new PIXI.Graphics();
      pulse = new PIXI.Graphics();
      app.stage.addChild(field, pulse);
      app.ticker.maxFPS = 30;
      redrawRef.current = drawField;
      drawField();
      app.ticker.add(() => {
        if (!app) return;
        const started = performance.now();
        const current = propsRef.current;
        if (app.screen.width !== renderedWidth
          || app.screen.height !== renderedHeight
          || current.projection !== renderedProjection
          || current.debug !== renderedDebug
          || current.reduceParticles !== renderedReduced) drawField();
        drawPulse(started);
        renderTotal += performance.now() - started;
        sampleFrames += 1;
        const now = performance.now();
        if (current.onPerformance && now - sampleStarted >= 800) {
          current.onPerformance({ fps: (sampleFrames * 1000) / (now - sampleStarted), renderMs: renderTotal / sampleFrames });
          sampleStarted = now;
          sampleFrames = 0;
          renderTotal = 0;
        }
      });
      const syncVisibility = () => {
        if (!app) return;
        if (document.hidden) app.stop();
        else app.start();
      };
      document.addEventListener("visibilitychange", syncVisibility);
      visibilityCleanup = () => document.removeEventListener("visibilitychange", syncVisibility);
      syncVisibility();
    };
    setStatus("loading");
    void boot().catch(() => { if (!disposed) setStatus("error"); });
    return () => {
      disposed = true;
      redrawRef.current = null;
      visibilityCleanup();
      if (initialized) app?.destroy(true, { children: true });
      host.replaceChildren();
    };
  }, [attempt]);

  return <div className="absolute inset-0"><div ref={hostRef} className="size-full" aria-label={t("beliefField")} role="img" /><CanvasStatus status={status} onRetry={() => setAttempt((value) => value + 1)} /></div>;
}

type XRayCanvasProps = { facility: Facility; frame: ReplayFrame; reduceParticles?: boolean };

export function XRayCanvas({ facility, frame, reduceParticles = false }: XRayCanvasProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const hostRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ facility, frame, reduceParticles });
  const redrawRef = useRef<(() => void) | null>(null);
  propsRef.current = { facility, frame, reduceParticles };

  useEffect(() => redrawRef.current?.(), [facility, frame, reduceParticles]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let app: Application | null = null;
    let initialized = false;
    let field: Graphics | null = null;
    let pendingFrame = 0;
    let observer: ResizeObserver | undefined;

    const requestDraw = () => {
      if (disposed || !initialized || document.hidden || pendingFrame) return;
      pendingFrame = requestAnimationFrame(() => {
        pendingFrame = 0;
        if (disposed || !app || document.hidden) return;
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        if (app.screen.width !== width || app.screen.height !== height) app.renderer.resize(width, height);
        draw();
        app.render();
      });
    };

    const syncVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(pendingFrame);
        pendingFrame = 0;
      } else requestDraw();
    };

    const draw = () => {
      if (!app || !field) return;
      const current = propsRef.current;
      const width = app.screen.width;
      const height = app.screen.height;
      const scale = Math.min(width / current.facility.width, height / current.facility.height) * 0.9;
      const offsetX = (width - current.facility.width * scale) / 2;
      const offsetY = (height - current.facility.height * scale) / 2;
      field.clear();
      field.rect(0, 0, width, height).fill({ color: 0x030708, alpha: 0.75 });
      for (let y = 0; y < current.facility.height; y += 1) {
        for (let x = 0; x < current.facility.width; x += 1) {
          if (current.facility.cells[y * current.facility.width + x] === 1) field.rect(offsetX + x * scale, offsetY + y * scale, scale, scale).fill({ color: 0x29403c, alpha: 0.56 });
        }
      }
      current.frame.likelihood?.forEach((value, index) => {
        if (value < 0.02) return;
        const x = index % current.facility.width;
        const y = Math.floor(index / current.facility.width);
        field?.rect(offsetX + x * scale, offsetY + y * scale, scale, scale).fill({ color: 0x7f95ff, alpha: Math.min(0.46, value * 0.42) });
      });
      current.frame.hunterBelief.forEach((value, index) => {
        if (value < 0.0008) return;
        const x = index % current.facility.width;
        const y = Math.floor(index / current.facility.width);
        field?.rect(offsetX + x * scale, offsetY + y * scale, scale, scale).fill({ color: 0xd9a05b, alpha: Math.min(0.72, value * 25) });
      });
      current.frame.particles.forEach((particle, index) => {
        if (current.reduceParticles && index % 3 !== 0) return;
        field?.circle(offsetX + (particle.x + 0.5) * scale, offsetY + (particle.y + 0.5) * scale, 1.2).fill({ color: 0x78e2cf, alpha: 0.64 });
      });
      current.facility.cores.forEach((core) => field?.rect(offsetX + core.x * scale, offsetY + core.y * scale, scale, scale).stroke({ color: 0x91d48f, width: 1, alpha: 0.8 }));
      field.circle(offsetX + (current.frame.player.x + 0.5) * scale, offsetY + (current.frame.player.y + 0.5) * scale, 4).fill({ color: 0xf5fff9, alpha: 1 });
      field.circle(offsetX + (current.frame.hunter.x + 0.5) * scale, offsetY + (current.frame.hunter.y + 0.5) * scale, 4).fill({ color: 0xff655e, alpha: 1 });
    };

    const boot = async () => {
      const PIXI = await import("pixi.js");
      if (disposed) return;
      app = new PIXI.Application();
      await app.init({ width: Math.max(1, host.clientWidth), height: Math.max(1, host.clientHeight), autoStart: false, backgroundAlpha: 0, antialias: true, resolution: Math.min(window.devicePixelRatio, 2), autoDensity: true });
      initialized = true;
      if (disposed) {
        app.destroy(true);
        return;
      }
      host.appendChild(app.canvas);
      setStatus("ready");
      field = new PIXI.Graphics();
      app.stage.addChild(field);
      redrawRef.current = requestDraw;
      observer = new ResizeObserver(requestDraw);
      observer.observe(host);
      document.addEventListener("visibilitychange", syncVisibility);
      requestDraw();
    };
    setStatus("loading");
    void boot().catch(() => { if (!disposed) setStatus("error"); });
    return () => {
      disposed = true;
      redrawRef.current = null;
      cancelAnimationFrame(pendingFrame);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", syncVisibility);
      if (initialized) app?.destroy(true, { children: true });
      host.replaceChildren();
    };
  }, [attempt]);

  return <div className="absolute inset-0"><div ref={hostRef} className="size-full" aria-label={t("xrayField")} role="img" /><CanvasStatus status={status} onRetry={() => setAttempt((value) => value + 1)} /></div>;
}

function CanvasStatus({ status, onRetry }: { status: "loading" | "ready" | "error"; onRetry: () => void }) {
  const { t } = useI18n();
  if (status === "ready") return null;
  return <div className="absolute inset-0 grid place-items-center p-6" role="status"><div className="max-w-sm text-center"><p className="text-sm leading-7 text-muted-foreground">{t(status === "error" ? "canvasError" : "initializing")}</p>{status === "error" && <Button variant="secondary" className="mt-4" onClick={onRetry}>{t("retryCanvas")}</Button>}</div></div>;
}
