"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { isRunSessionOnly, type StoredRun } from "@/lib/storage";

export function RunStorageNotice({ run }: { run: StoredRun }) {
  const { t } = useI18n();
  if (!isRunSessionOnly(run.id)) return null;
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(run)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `echo-replay-${run.savedAt}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="my-6 flex flex-col items-start gap-4 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between">
      <p role="status" className="max-w-[65ch] text-sm leading-7 text-muted-foreground">{t("sessionOnly")}</p>
      <Button variant="secondary" className="shrink-0" onClick={download}><Download data-icon="inline-start" />{t("downloadReplay")}</Button>
    </div>
  );
}
