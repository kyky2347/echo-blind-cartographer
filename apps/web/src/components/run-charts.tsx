"use client";

import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { memo } from "react";
import type { ReplayFrame } from "@echo/inference-core";
import { useI18n } from "@/lib/i18n";

const tooltipStyle = { background: "#081011", border: "1px solid rgba(121,221,203,.25)", borderRadius: 0, fontFamily: "IBM Plex Mono", fontSize: 10 };

export const ReplayLineChart = memo(function ReplayLineChart({ frames }: { frames: ReplayFrame[] }) {
  const { t } = useI18n();
  const data = frames.map((frame) => ({ tick: frame.tick, uncertainty: Number(frame.entropy.toFixed(3)), hunter: Number(frame.hunterEntropy.toFixed(3)), energy: Number(frame.energy.toFixed(2)), signal: Number(frame.signature.toFixed(2)) }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="rgba(110,160,150,.12)" vertical={false} />
        <XAxis dataKey="tick" stroke="#65807c" tickLine={false} axisLine={false} tick={{ fontSize: 9, fontFamily: "IBM Plex Mono" }} />
        <YAxis stroke="#65807c" tickLine={false} axisLine={false} tick={{ fontSize: 9, fontFamily: "IBM Plex Mono" }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 9, fontFamily: "IBM Plex Mono", textTransform: "uppercase" }} />
        {frames.filter((frame) => frame.action.startsWith("sensor:")).map((frame) => (
          <ReferenceLine key={`${frame.tick}:${frame.action}`} x={frame.tick} stroke={frame.action === "sensor:sonar" ? "#e35d55" : "#79ddcb"} strokeDasharray="2 3" strokeOpacity={0.7} />
        ))}
        <Line name={t("uncertainty")} type="monotone" dataKey="uncertainty" stroke="#79ddcb" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Line name={t("hunter")} type="monotone" dataKey="hunter" stroke="#e25d56" strokeWidth={1} dot={false} isAnimationActive={false} />
        <Line name={t("energy")} type="monotone" dataKey="energy" stroke="#8ecf8d" strokeWidth={1} dot={false} isAnimationActive={false} />
        <Line name={t("signature")} type="monotone" dataKey="signal" stroke="#c5a65f" strokeWidth={1} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
});

export const TradeoffChart = memo(function TradeoffChart({ frames }: { frames: ReplayFrame[] }) {
  const { t } = useI18n();
  const data = frames.filter((frame) => frame.action.startsWith("sensor:")).map((frame) => ({ information: Number(frame.informationGain.toFixed(3)), signature: Number(frame.signature.toFixed(2)), action: frame.action.replace("sensor:", "") }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 10, right: 15, bottom: 5, left: -10 }}>
        <CartesianGrid stroke="rgba(110,160,150,.12)" />
        <XAxis type="number" dataKey="information" name={t("information")} unit=" bit" stroke="#65807c" tick={{ fontSize: 9 }} />
        <YAxis type="number" dataKey="signature" name={t("signature")} stroke="#65807c" tick={{ fontSize: 9 }} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={tooltipStyle} />
        <Scatter data={data} fill="#79ddcb" isAnimationActive={false} />
      </ScatterChart>
    </ResponsiveContainer>
  );
});
