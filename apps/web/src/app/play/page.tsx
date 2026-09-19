"use client";

import { Accessibility, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, AudioLines, Copy, DoorOpen, Radio, Radar, ScanLine, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SENSOR_CONFIG,
  createGame,
  endRunForDebug,
  expectedSensorValue,
  objectiveSignal,
  projectPlayState,
  type Direction,
  type SensorKind,
} from "@echo/inference-core";
import { BeliefCanvas } from "@/components/belief-canvas";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { playTone } from "@/lib/audio";
import { useI18n } from "@/lib/i18n";
import { saveRun } from "@/lib/storage";
import { cn, percent } from "@/lib/utils";
import { useGameStore } from "@/stores/game-store";

const SENSOR_ICONS = { passive: Volume2, ping: Radio, sonar: Radar, beacon: ScanLine };

export default function PlayPage() {
  const { locale, setLocale, t } = useI18n();
  const router = useRouter();
  const game = useGameStore((state) => state.game);
  const restore = useGameStore((state) => state.restore);
  const move = useGameStore((state) => state.move);
  const scan = useGameStore((state) => state.scan);
  const introSeen = useGameStore((state) => state.introSeen);
  const setIntroSeen = useGameStore((state) => state.setIntroSeen);
  const tutorialStep = useGameStore((state) => state.tutorialStep);
  const setTutorialStep = useGameStore((state) => state.setTutorialStep);
  const muted = useGameStore((state) => state.muted);
  const setMuted = useGameStore((state) => state.setMuted);
  const reduceParticles = useGameStore((state) => state.reduceParticles);
  const setReduceParticles = useGameStore((state) => state.setReduceParticles);
  const lastUpdateMs = useGameStore((state) => state.lastUpdateMs);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [debug, setDebug] = useState(false);
  const [debugExpanded, setDebugExpanded] = useState(false);
  const [renderPerformance, setRenderPerformance] = useState({ fps: 0, renderMs: 0 });
  const priorMode = useRef(game?.hunterMode);
  const priorCores = useRef(game?.truth.collected.filter(Boolean).length ?? 0);
  const completed = useRef(false);

  useEffect(() => () => clearTimeout(copyTimer.current), []);
  const copySeed = async () => {
    if (!game) return;
    clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(game.seed);
      setCopyStatus("copied");
      copyTimer.current = setTimeout(() => setCopyStatus("idle"), 1800);
    } catch {
      setCopyStatus("failed");
    }
  };

  useEffect(() => {
    if (!game) restore(createGame("ECHO-482951", "signal"));
    setDebug(new URLSearchParams(window.location.search).get("debug") === "1");
  }, [game, restore]);

  useEffect(() => {
    if (!game || game.result === "active" || completed.current) return;
    completed.current = true;
    const stored = saveRun(game);
    playTone(game.result === "survived" ? "extract" : "warning", muted);
    router.push(`/debrief?id=${encodeURIComponent(stored.id)}`);
  }, [game, muted, router]);

  useEffect(() => {
    if (!game) return;
    if (priorMode.current !== game.hunterMode && ["searching", "hunting", "contact"].includes(game.hunterMode)) playTone("warning", muted);
    priorMode.current = game.hunterMode;
  }, [game, muted]);

  useEffect(() => {
    if (!game) return;
    const count = game.truth.collected.filter(Boolean).length;
    if (count > priorCores.current) playTone("core", muted);
    priorCores.current = count;
  }, [game, muted]);

  const actMove = useCallback((direction: Direction) => {
    move(direction);
    playTone("move", muted);
    if (tutorialStep === 0) setTutorialStep(1);
  }, [move, muted, setTutorialStep, tutorialStep]);

  const actSensor = useCallback((sensor: SensorKind) => {
    if (!game || game.sensorCooldowns[sensor] > 0 || game.energy < SENSOR_CONFIG[sensor].energy) return;
    scan(sensor);
    playTone(sensor === "passive" ? "ping" : sensor, muted);
    if (tutorialStep === 1 && sensor === "passive") setTutorialStep(2);
    else if (tutorialStep === 2 && sensor === "ping") setTutorialStep(3);
    else if (tutorialStep === 3 && sensor === "sonar") setTutorialStep(4);
  }, [game, muted, scan, setTutorialStep, tutorialStep]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!introSeen || event.repeat || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable=true], [role=slider], [role=switch]")) return;
      const keyMap: Record<string, Direction> = { w: "north", arrowup: "north", d: "east", arrowright: "east", s: "south", arrowdown: "south", a: "west", arrowleft: "west" };
      const direction = keyMap[event.key.toLowerCase()];
      if (direction) { event.preventDefault(); actMove(direction); }
      if (event.key === "1") actSensor("passive");
      if (event.key === "2") actSensor("ping");
      if (event.key === "3") actSensor("sonar");
      if (event.key === "4") actSensor("beacon");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actMove, actSensor, introSeen]);

  const projection = useMemo(() => game ? projectPlayState(game) : null, [game]);
  const eig = useMemo(() => {
    if (!game) return null;
    return Object.fromEntries((["passive", "ping", "sonar", "beacon"] as const).map((sensor) => [sensor, expectedSensorValue(game, sensor)])) as Record<SensorKind, number>;
  }, [game]);
  const signal = useMemo(() => game ? objectiveSignal(game) : null, [game]);
  const debugStateKb = useMemo(() => debug && game ? new TextEncoder().encode(JSON.stringify(game)).byteLength / 1024 : 0, [debug, game]);
  const debugLayer = useMemo(() => debug && game ? { facility: game.facility, truth: game.truth, belief: game.belief, hunterBelief: game.hunterBelief, hunterTarget: game.hunterTarget } : undefined, [debug, game]);

  if (!game || !projection || !eig || !signal) return <main className="grid min-h-screen place-items-center" role="status"><p className="survey-label animate-pulse">{t("initializing")}</p></main>;

  return (
    <main className="relative h-[100svh] overflow-hidden bg-[#020506]">
      <div className="contents" inert={!introSeen}>
      <BeliefCanvas projection={projection} reduceParticles={reduceParticles} debug={debugLayer} onPerformance={debug ? setRenderPerformance : undefined} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_24%,rgba(2,5,6,.44)_68%,rgba(2,5,6,.9)_100%)]" />

      <header className="absolute inset-x-0 top-0 z-20 grid grid-cols-[1fr_auto] items-start gap-2 border-b border-border/70 bg-background/76 p-3 backdrop-blur-md md:grid-cols-[180px_1fr_180px] md:gap-3 md:px-5">
        <div className="hidden md:block"><p className="font-display text-sm tracking-[.32em]">ECHO</p><p className="mt-1 font-mono text-[9px] tracking-[.1em] text-muted-foreground">{game.seed}</p></div>
        <div className="flex justify-start gap-4 md:justify-center md:gap-10">
          <HudMetric label={t("energy")} value={percent(game.energy / game.maxEnergy)} tone={game.energy < game.maxEnergy * 0.2 ? "danger" : "normal"} />
          <HudMetric label={t("uncertainty")} value={`${game.belief.entropy.toFixed(2)} bit`} />
          <HudMetric label={t("signature")} value={game.signature < 8 ? t("low") : game.signature < 28 ? t("medium") : t("high")} tone={game.signature >= 28 ? "danger" : "normal"} />
          <HudMetric label={t("cores")} value={`${projection.coresCollected} / 3`} className="hidden sm:block" />
        </div>
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => setMuted(!muted)} aria-label={muted ? t("unmute") : t("mute")} aria-pressed={muted}>{muted ? <VolumeX /> : <AudioLines />}</Button>
          <Button variant="ghost" size="sm" onClick={() => setLocale(locale === "en" ? "zh" : "en")} aria-label={locale === "en" ? "切换到中文" : "Switch to English"}>{t("language")}</Button>
        </div>
      </header>

      <div className="absolute inset-x-3 top-[65px] z-20 grid grid-cols-3 gap-px bg-border/80 lg:hidden">
        <MobileMetric label={t("cores")} value={`${projection.coresCollected} / 3`} />
        <MobileMetric label={projection.extractionRevealed ? t("extraction") : t("objective")} value={`${t(signal.bearing)} · ${t(signal.strength)}`} />
        <MobileMetric label={t("hunter")} value={t(game.hunterMode)} tone={game.hunterMode === "quiet" ? "normal" : "danger"} />
      </div>

      <aside className="absolute left-4 top-1/2 z-20 hidden w-52 -translate-y-1/2 flex-col gap-2 lg:flex">
        {(["passive", "ping", "sonar", "beacon"] as const).map((sensor, index) => <SensorButton key={sensor} sensor={sensor} index={index} eig={eig[sensor]} disabled={game.sensorCooldowns[sensor] > 0 || game.energy < SENSOR_CONFIG[sensor].energy} cooldown={game.sensorCooldowns[sensor]} onClick={() => actSensor(sensor)} t={t} />)}
      </aside>

      <aside className="absolute right-4 top-1/2 z-20 hidden w-48 -translate-y-1/2 lg:block">
        <div className="corner-marks bg-background/68 p-5 backdrop-blur-sm">
          <p className="survey-label">{projection.extractionRevealed ? t("extraction") : t("objective")}</p>
          <div className="mt-5 flex items-end justify-between">
            <p className="font-display text-3xl uppercase tracking-[.05em] text-accent">{t(signal.bearing)}</p>
            <p className="font-mono text-[10px] uppercase text-muted-foreground">{t(signal.strength)}</p>
          </div>
          <div className="mt-4 h-px bg-border"><div className="h-px bg-accent" style={{ width: `${Math.max(8, 100 - signal.distance * 3)}%` }} /></div>
          <p className="mt-5 survey-label">{t("hunter")} / {t(game.hunterMode)}</p>
          <div className={cn("mt-2 h-1 w-full", game.hunterMode === "quiet" ? "bg-accent/40" : game.hunterMode === "disturbance" ? "bg-[#c8a75e]" : "bg-destructive animate-pulse")} />
        </div>
      </aside>

      {tutorialStep <= 4 && introSeen && (
        <div className="absolute left-1/2 top-36 z-20 w-[min(92vw,540px)] -translate-x-1/2 border-y border-primary/30 bg-background/78 px-5 py-3 text-center backdrop-blur-sm lg:top-24">
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">{[t("tutorialMove"), t("tutorialListen"), t("tutorialPing"), t("tutorialSonar"), t("tutorialDone")][tutorialStep]}</p>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 bg-gradient-to-t from-background via-background/86 to-transparent px-3 pb-3 pt-12 lg:pb-5">
        <p className="font-mono text-[9px] tracking-[.14em] text-muted-foreground md:hidden">{game.seed}</p>
        <div className="flex max-w-full gap-2 overflow-x-auto lg:hidden">
          {(["passive", "ping", "sonar", "beacon"] as const).map((sensor, index) => <SensorButton key={sensor} sensor={sensor} index={index} eig={eig[sensor]} compact disabled={game.sensorCooldowns[sensor] > 0 || game.energy < SENSOR_CONFIG[sensor].energy} cooldown={game.sensorCooldowns[sensor]} onClick={() => actSensor(sensor)} t={t} />)}
        </div>
        <MovementPad onMove={actMove} t={t} />
        <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">
          <button type="button" onClick={copySeed} aria-label={copyStatus === "copied" ? t("copied") : t("copySeed")} className="flex min-h-10 items-center gap-2 hover:text-foreground"><Copy className="size-3" /><span role="status">{copyStatus === "copied" ? t("copied") : t("copySeed")}</span></button>
          <Link href="/" className="flex items-center gap-2 hover:text-foreground"><DoorOpen className="size-3" />{t("menu")}</Link>
          <label className="flex items-center gap-2"><Accessibility className="size-3" />{t("reduceParticles")}<Switch checked={reduceParticles} onCheckedChange={setReduceParticles} /></label>
        </div>
        {copyStatus === "failed" && <div role="status" className="max-w-full text-center text-xs text-muted-foreground"><p>{t("copyFailed")}</p><code className="mt-1 block select-all break-all text-foreground">{game.seed}</code></div>}
      </div>

      {debug && (
        <div className="absolute right-3 top-28 z-30 max-h-[calc(100svh-9rem)] max-w-[calc(100vw-1.5rem)] overflow-auto bg-black/90 p-2 font-mono text-[10px] leading-5 text-destructive lg:top-20 lg:p-3">
          <button type="button" className="border border-destructive/60 px-2 py-1 lg:hidden" aria-expanded={debugExpanded} onClick={() => setDebugExpanded(!debugExpanded)}>{debugExpanded ? t("collapseDebug") : t("expandDebug")}</button>
          <div className={cn("mt-2 lg:mt-0 lg:block", debugExpanded ? "block" : "hidden")}>
            DEBUG / TRUE STATE<br/>tick {game.tick}<br/>P {game.truth.player.x},{game.truth.player.y}<br/>H {game.truth.hunter.x},{game.truth.hunter.y}<br/>target {game.hunterTarget.x},{game.hunterTarget.y}<br/>RNG {game.rngState}<br/>
            <span className="text-primary">FPS {renderPerformance.fps.toFixed(0)}<br/>particles {game.belief.particles.length}<br/>update {lastUpdateMs.toFixed(2)} ms<br/>render {renderPerformance.renderMs.toFixed(2)} ms<br/>state ~{debugStateKb.toFixed(0)} KB<br/>likelihood {game.belief.lastLikelihood ? "visible" : "none"}</span><br/>
            <button type="button" className="mt-2 border border-destructive/60 px-2 py-1 hover:bg-destructive/10" onClick={() => restore(endRunForDebug(game))}>TRIGGER DEBRIEF</button>
          </div>
        </div>
      )}
      </div>
      {!introSeen && <IntroOverlay onDone={() => setIntroSeen(true)} t={t} />}
    </main>
  );
}

function HudMetric({ label, value, tone = "normal", className }: { label: string; value: string; tone?: "normal" | "danger"; className?: string }) {
  return <div className={className}><p className="survey-label whitespace-nowrap">{label}</p><p className={cn("mt-1 font-mono text-xs tabular-nums md:text-sm", tone === "danger" ? "text-destructive" : "text-foreground")}>{value}</p></div>;
}

function MobileMetric({ label, value, tone = "normal" }: { label: string; value: string; tone?: "normal" | "danger" }) {
  return <div className="min-w-0 bg-background/86 px-2 py-2 backdrop-blur-md"><p className="truncate font-mono text-[7px] uppercase tracking-[.12em] text-muted-foreground">{label}</p><p className={cn("mt-1 truncate font-mono text-[9px] uppercase", tone === "danger" ? "text-destructive" : "text-foreground")}>{value}</p></div>;
}

function SensorButton({ sensor, index, eig, disabled, cooldown, onClick, compact, t }: { sensor: SensorKind; index: number; eig: number; disabled: boolean; cooldown: number; onClick: () => void; compact?: boolean; t: ReturnType<typeof useI18n>["t"] }) {
  const Icon = SENSOR_ICONS[sensor];
  const config = SENSOR_CONFIG[sensor];
  const infoLevel = eig < 0.4 ? "low" : eig < 2.2 ? "medium" : "high";
  const signatureLevel = config.signature < 2 ? "low" : config.signature < 20 ? "medium" : "high";
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={cn("group border border-border bg-background/76 text-left backdrop-blur-sm transition-[background-color,border-color,transform] hover:border-primary/55 hover:bg-primary/5 disabled:opacity-35", compact ? "min-w-[168px] p-3" : "w-full p-4")} aria-label={`${t(sensor)}, ${eig.toFixed(2)} bits`}>
      <div className="flex items-center justify-between"><Icon className="size-4 text-primary" /><span className="font-mono text-[9px] text-muted-foreground">{index + 1}</span></div>
      <p className="mt-3 font-display text-xs uppercase tracking-[.08em]">{t(sensor)}</p>
      <dl className="mt-3 grid gap-1 font-mono text-[8px] uppercase tracking-[.06em]">
        <SensorDatum label={t("info")} value={t(infoLevel)} />
        <SensorDatum label={t("cost")} value={`${config.energy} E`} />
        <SensorDatum label={t("emitted")} value={t(signatureLevel)} danger={signatureLevel === "high"} />
      </dl>
      {!compact && <div className="mt-3 h-px bg-border"><div className={cn("h-px", config.signature > 20 ? "bg-destructive" : "bg-primary")} style={{ width: `${Math.min(100, config.signature * 2.2 + 7)}%` }} /></div>}
      {cooldown > 0 && <p className="mt-2 font-mono text-[9px] text-destructive">{t("cooldown")} {cooldown}</p>}
    </button>
  );
}

function SensorDatum({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return <div className="flex items-center justify-between gap-3"><dt className="truncate text-muted-foreground">{label}</dt><dd className={cn("shrink-0", danger ? "text-destructive" : "text-foreground")}>{value}</dd></div>;
}

function MovementPad({ onMove, t }: { onMove: (direction: Direction) => void; t: ReturnType<typeof useI18n>["t"] }) {
  const item = "grid size-10 place-items-center border border-border bg-background/70 text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary hover:text-primary";
  return (
    <div className="grid grid-cols-3 gap-1" aria-label={t("movementControls")} role="group">
      <span /><button className={item} onClick={() => onMove("north")} aria-label={t("moveNorth")}><ArrowUp className="size-4" /></button><span />
      <button className={item} onClick={() => onMove("west")} aria-label={t("moveWest")}><ArrowLeft className="size-4" /></button><div className="grid size-10 place-items-center border border-border/50 bg-background/50 font-mono text-[8px] text-muted-foreground">WASD</div><button className={item} onClick={() => onMove("east")} aria-label={t("moveEast")}><ArrowRight className="size-4" /></button>
      <span /><button className={item} onClick={() => onMove("south")} aria-label={t("moveSouth")}><ArrowDown className="size-4" /></button><span />
    </div>
  );
}

function IntroOverlay({ onDone, t }: { onDone: () => void; t: ReturnType<typeof useI18n>["t"] }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={t("subtitle")} className="absolute inset-0 z-50 grid place-items-center overflow-y-auto bg-[#020405]/96 p-5">
      <div className="w-full max-w-xl corner-marks p-8 md:p-12">
        <div className="flex flex-col gap-3">
          {(["intro1", "intro2", "intro3", "intro4", "intro5"] as const).map((key, index) => <p key={key} className={cn("font-mono text-xs uppercase tracking-[.2em]", index === 4 ? "text-destructive" : index === 3 ? "text-accent" : "text-muted-foreground")}>{t(key)}</p>)}
        </div>
        <Button autoFocus className="mt-10 w-full" size="lg" onClick={onDone}>{t("begin")}<ArrowRight data-icon="inline-end" /></Button>
      </div>
    </div>
  );
}
