"use client";

import { Pause, Play, SkipBack } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { XRayCanvas } from "@/components/belief-canvas";
import { ReplayLineChart, TradeoffChart } from "@/components/run-charts";
import { RunStorageNotice } from "@/components/run-storage-notice";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/lib/i18n";
import { loadRun, type StoredRun } from "@/lib/storage";
import { useGameStore } from "@/stores/game-store";

export default function ReplayPage() {
  const { t } = useI18n();
  const reduceParticles = useGameStore((state) => state.reduceParticles);
  const params = useParams<{ id: string }>();
  const [run, setRun] = useState<StoredRun | null>(null);
  const [resolved, setResolved] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);
  useEffect(() => {
    setRun(loadRun(params.id) ?? null);
    setCursor(0);
    setPlaying(false);
    setResolved(true);
  }, [params.id]);
  useEffect(() => {
    if (!playing || !run) return;
    if (cursor >= run.state.frames.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setCursor((value) => value + 1), 650 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, run, speed, cursor]);
  const frame = run?.state.frames[cursor];
  const path = useMemo(() => run?.state.frames.slice(0, cursor + 1) ?? [], [run, cursor]);
  if (!resolved) return <main className="grid min-h-screen place-items-center pt-16" role="status"><p className="survey-label animate-pulse">{t("loading")}</p></main>;
  if (!run || !frame) return <main className="grid min-h-screen place-items-center pt-16"><div className="text-center"><p className="survey-label">{t("noReplay")}</p><Link href="/history" className="mt-5 inline-block font-mono text-xs text-primary">{t("returnHistory")}</Link></div></main>;
  return (
    <main className="mx-auto min-h-screen max-w-[1540px] px-4 pb-16 pt-24 md:px-8">
      <RunStorageNotice run={run} />
      <header className="flex flex-col gap-5 border-b border-border/70 pb-6 md:flex-row md:items-end md:justify-between">
        <div><h1 className="font-display text-4xl tracking-[-.035em] md:text-6xl">{t("replayTitle")}</h1><p className="mt-3 font-mono text-[10px] text-muted-foreground">{run.seed} / {frame.action.toUpperCase()}</p></div>
        <div className="flex gap-6"><ReplayStat label={t("uncertainty")} value={`${frame.entropy.toFixed(2)} bit`} /><ReplayStat label={t("signature")} value={frame.signature.toFixed(1)} /><ReplayStat label={`${t("hunter")} H`} value={`${frame.hunterEntropy.toFixed(2)} bit`} /></div>
      </header>
      <section aria-label={t("replayTimeline")} className="mt-5 instrument-panel px-4 py-4">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 md:flex md:gap-4">
          <div className="flex gap-2"><Button variant="secondary" size="icon" onClick={() => { setCursor(0); setPlaying(false); }} aria-label={t("restartReplay")}><SkipBack /></Button><Button size="icon" onClick={() => { if (cursor === run.state.frames.length - 1) setCursor(0); setPlaying(!playing); }} aria-label={playing ? t("pause") : t("playReplay")} aria-pressed={playing}>{playing ? <Pause /> : <Play />}</Button></div>
          <Slider aria-label={t("replayTimeline")} min={0} max={Math.max(1, run.state.frames.length - 1)} disabled={run.state.frames.length < 2} step={1} value={[cursor]} onValueChange={(values) => { setCursor(values[0] as number); setPlaying(false); }} />
          <div className="flex shrink-0 gap-1" aria-label={t("speed")} role="group">{[0.5, 1, 2, 4].map((item) => <button key={item} type="button" aria-pressed={speed === item} onClick={() => setSpeed(item)} className={`min-h-10 min-w-10 border px-2 py-1 font-mono text-[10px] ${speed === item ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>{item}×</button>)}</div>
          <p className="justify-self-end shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">{cursor + 1} / {run.state.frames.length}</p>
        </div>
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_.75fr]">
        <div className="instrument-panel relative min-h-[520px] overflow-hidden">
          <XRayCanvas facility={run.state.facility} frame={frame} reduceParticles={reduceParticles} />
          <div className="pointer-events-none absolute left-4 top-4 flex max-w-[calc(100%-2rem)] flex-wrap gap-x-4 gap-y-2 bg-background/75 p-3 backdrop-blur-sm"><LegendDot color="bg-foreground" label={t("truePlayer")} /><LegendDot color="bg-destructive" label={t("trueHunter")} /><LegendDot color="bg-primary" label={t("particleLegend")} /><LegendDot color="bg-[#7f95ff]" label={t("likelihood")} /><LegendDot color="bg-[#d9a05b]" label={t("hunterBelief")} /></div>
          <svg className="pointer-events-none absolute inset-0 size-full opacity-75" viewBox={`${-run.state.facility.width / 18} ${-run.state.facility.height / 18} ${run.state.facility.width / .9} ${run.state.facility.height / .9}`} preserveAspectRatio="xMidYMid meet" aria-hidden>
            <polyline points={path.map((item) => `${item.player.x + .5},${item.player.y + .5}`).join(" ")} fill="none" stroke="#e8fff9" strokeWidth=".1" />
            <polyline points={path.map((item) => `${item.hunter.x + .5},${item.hunter.y + .5}`).join(" ")} fill="none" stroke="#e35d55" strokeWidth=".1" />
          </svg>
        </div>
        <div className="grid gap-6">
          <div className="instrument-panel p-4"><div className="flex items-center justify-between gap-3"><p className="survey-label">{t("timeline")}</p><span className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.1em] text-muted-foreground"><span className="h-3 border-l border-dashed border-primary" />{t("scanEvents")}</span></div><div className="mt-4 h-[210px]"><ReplayLineChart frames={run.state.frames} /></div></div>
          <div className="instrument-panel p-4"><p className="survey-label">{t("infoEmission")}</p><div className="mt-4 h-[210px]"><TradeoffChart frames={run.state.frames} /></div></div>
        </div>
      </section>
    </main>
  );
}

function ReplayStat({ label, value }: { label: string; value: string }) { return <div><p className="survey-label">{label}</p><p className="mt-1 font-mono text-xs tabular-nums">{value}</p></div>; }
function LegendDot({ color, label }: { color: string; label: string }) { return <span className="flex items-center gap-2 font-mono text-[8px] tracking-[.1em] text-muted-foreground"><span className={`size-1.5 ${color}`} />{label}</span>; }
