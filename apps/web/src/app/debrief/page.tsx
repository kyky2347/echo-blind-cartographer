"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { scoreRun } from "@echo/inference-core";
import { ReplayLineChart, TradeoffChart } from "@/components/run-charts";
import { RunStorageNotice } from "@/components/run-storage-notice";
import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { loadRun, saveRun, type StoredRun } from "@/lib/storage";
import { formatTime } from "@/lib/utils";
import { useGameStore } from "@/stores/game-store";

export default function DebriefPage() {
  const { t } = useI18n();
  const current = useGameStore((state) => state.game);
  const start = useGameStore((state) => state.start);
  const [run, setRun] = useState<StoredRun | null>(null);
  const [resolved, setResolved] = useState(false);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    const stored = id ? loadRun(id) : undefined;
    if (stored) setRun(stored);
    else if (current && current.result !== "active") setRun(saveRun(current));
    else setRun(null);
    setResolved(true);
  }, [current]);

  if (!resolved) return <main className="grid min-h-screen place-items-center pt-16" role="status"><p className="survey-label animate-pulse">{t("loading")}</p></main>;
  if (!run) return <main className="grid min-h-screen place-items-center pt-16"><div className="text-center"><p className="survey-label">{t("noReplay")}</p><Link className="mt-5 inline-block font-mono text-xs text-primary" href="/history">{t("returnHistory")}</Link></div></main>;
  const state = run.state;
  const score = scoreRun(state);
  const entropies = state.metrics.entropySamples.length ? state.metrics.entropySamples : [state.belief.entropy];
  const averageEntropy = entropies.reduce((sum, value) => sum + value, 0) / entropies.length;
  const maxEntropy = Math.max(...entropies);
  const metrics = [
    [t("time"), formatTime(run.duration)], [t("moves"), state.metrics.moves], [t("scans"), state.metrics.scans], [t("energyUsed"), state.metrics.energyUsed.toFixed(1)],
    [t("maxUncertainty"), `${maxEntropy.toFixed(2)} bit`], [t("avgUncertainty"), `${averageEntropy.toFixed(2)} bit`], [t("informationGain"), `${state.metrics.informationGain.toFixed(2)} bit`],
    [t("generated"), state.metrics.signatureGenerated.toFixed(1)], [t("contacts"), state.metrics.contactEvents],
  ];
  return (
    <main className="mx-auto min-h-screen max-w-[1440px] px-4 pb-20 pt-28 md:px-8">
      <RunStorageNotice run={run} />
      <section className="grid gap-8 border-b border-border/70 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className={`font-mono text-xs uppercase tracking-[.28em] ${state.result === "survived" ? "text-accent" : "text-destructive"}`}>{state.result === "survived" ? t("survived") : t("lost")}</p>
          <h1 className="mt-4 font-display text-5xl tracking-[-.035em] md:text-7xl">{t("debrief")}</h1>
          <p className="mt-4 font-mono text-xs text-muted-foreground">{state.seed} / {t(state.difficulty)}</p>
        </div>
        <div className="min-w-52 border-l border-primary/30 pl-6"><p className="survey-label">{t("score")}</p><p className="mt-2 font-display text-7xl tabular-nums text-primary">{score.total}</p></div>
      </section>
      <section className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-3 lg:grid-cols-9">
        {metrics.map(([label, value]) => <div key={String(label)} className="min-h-28 bg-background p-4"><p className="survey-label">{label}</p><p className="mt-5 font-mono text-lg tabular-nums">{value}</p></div>)}
      </section>
      <section className="mt-10 grid gap-6 lg:grid-cols-[1.45fr_.75fr]">
        <div className="instrument-panel p-4"><p className="survey-label">{t("beliefEnergySignal")}</p><div className="mt-4 h-[280px]"><ReplayLineChart frames={state.frames} /></div></div>
        <div className="instrument-panel p-4"><p className="survey-label">{t("infoEmission")}</p><div className="mt-4 h-[280px]"><TradeoffChart frames={state.frames} /></div></div>
      </section>
      <section className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-5">
        {Object.entries(score).filter(([key]) => key !== "total").map(([key, value]) => <div key={key} className="bg-background p-4"><p className="survey-label">{t(key as "survival" | "energy" | "information" | "stealth" | "navigation")}</p><p className="mt-2 font-mono text-xl tabular-nums">{value}</p></div>)}
      </section>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/replay/${encodeURIComponent(run.id)}`} className={buttonVariants({ size: "lg" })}>{t("openReplay")}<ArrowRight data-icon="inline-end" /></Link>
        <Link href="/play" onClick={() => start(state.seed, state.difficulty)} className={buttonVariants({ variant: "secondary", size: "lg" })}><RotateCcw data-icon="inline-start" />{t("restart")}</Link>
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "lg" })}>{t("newRun")}</Link>
      </div>
    </main>
  );
}
