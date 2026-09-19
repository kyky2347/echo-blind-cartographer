import { vi, afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render as renderView, screen } from "@testing-library/react";
import { createGame } from "@echo/inference-core";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { ReplayLineChart, TradeoffChart } from "./run-charts";

const counts = vi.hoisted(() => ({ line: 0, scatter: 0 }));
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: () => { counts.line += 1; return <div />; },
  ScatterChart: () => { counts.scatter += 1; return <div />; },
  CartesianGrid: () => null, Legend: () => null, Line: () => null, ReferenceLine: () => null,
  Scatter: () => null, Tooltip: () => null, XAxis: () => null, YAxis: () => null,
}));

function LanguageControl() {
  const { setLocale } = useI18n();
  return <button onClick={() => setLocale("zh")}>中文</button>;
}
afterEach(() => cleanup());

it("skips unchanged replay charts during scrubbing, but redraws for language and data changes", () => {
  counts.line = counts.scatter = 0;
  const frames = createGame("CHART-MEMO").frames;
  const content = (data = frames) => <I18nProvider><LanguageControl /><ReplayLineChart frames={data} /><TradeoffChart frames={data} /></I18nProvider>;
  const view = renderView(content());
  for (let cursor = 0; cursor < 10; cursor += 1) view.rerender(content());
  expect(counts).toEqual({ line: 1, scatter: 1 });
  fireEvent.click(screen.getByRole("button", { name: "中文" }));
  expect(counts).toEqual({ line: 2, scatter: 2 });
  view.rerender(content([...frames]));
  expect(counts).toEqual({ line: 3, scatter: 3 });
});
