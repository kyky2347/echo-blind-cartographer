import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { I18nProvider, useI18n } from "./i18n";

function LanguageControl() {
  const { t, setLocale } = useI18n();
  return <button onClick={() => setLocale("zh")}>{t("play")}</button>;
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("switches language and document semantics even when storage access is denied", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
  render(<I18nProvider><LanguageControl /></I18nProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Play" }));
  expect(screen.getByRole("button", { name: "游玩" })).toBeInTheDocument();
  expect(document.documentElement.lang).toBe("zh-CN");
});
