import { expect, test } from "@playwright/test";

test("home, language switch, and seeded game loop", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "ECHO" })).toBeVisible();
  await page.getByRole("button", { name: "切换到中文" }).click();
  await expect(page.getByRole("button", { name: "进入黑暗" })).toBeVisible();
  await page.getByRole("button", { name: "进入黑暗" }).click();
  await expect(page).toHaveURL(/\/play/);
  await page.getByRole("button", { name: "估计你的位置" }).click();
  await page.getByRole("button", { name: "向北移动" }).click();
  await page.getByRole("button", { name: /被动聆听/ }).first().click();
  await page.getByRole("button", { name: /短促脉冲/ }).first().click();
  await page.getByRole("button", { name: /主动声呐/ }).first().click();
  await expect(page.getByText(/更多信息/)).toBeVisible();
});

test("lab filter controls change the posterior", async ({ page }) => {
  await page.goto("/lab");
  await expect(page.getByRole("heading", { name: /Probability laboratory/ })).toBeVisible();
  await page.getByRole("button", { name: "Predict" }).click();
  await page.getByRole("button", { name: "Observe" }).click();
  await page.getByRole("button", { name: "Normalize" }).click();
  await page.getByRole("button", { name: "Resample" }).click();
  await expect(page.getByText(/resample/i).first()).toBeVisible();
});

test("deterministic debug run opens debrief and X-Ray", async ({ page }) => {
  await page.goto("/play?debug=1");
  await page.getByRole("button", { name: "Estimate position" }).click();
  const debugToggle = page.getByRole("button", { name: "Open debug telemetry" });
  if (await debugToggle.isVisible()) await debugToggle.click();
  await page.getByRole("button", { name: "TRIGGER DEBRIEF" }).click();
  await expect(page).toHaveURL(/\/debrief\?id=/);
  await expect(page.getByRole("heading", { name: "Run debrief" })).toBeVisible();
  await page.getByRole("link", { name: /Open X-Ray replay/ }).click();
  await expect(page).toHaveURL(/\/replay\//);
  await expect(page.getByRole("heading", { name: "X-Ray replay" })).toBeVisible();
  await expect(page.getByRole("img", { name: "X-Ray true-state replay" }).locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "4×", exact: true }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Replay timeline" })).toHaveAttribute("aria-valuenow", "1");
  await expect(page.getByRole("button", { name: "Play", exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Restart replay" }).click();
  await expect(page.getByRole("slider", { name: "Replay timeline" })).toHaveAttribute("aria-valuenow", "0");
});

test("storage-denied sessions still support language, debrief, replay, and backup", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException("Storage disabled", "SecurityError"); };
    Storage.prototype.setItem = () => { throw new DOMException("Storage disabled", "SecurityError"); };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "切换到中文" }).click();
  await expect(page.getByRole("button", { name: "进入黑暗" })).toBeVisible();
  await page.goto("/play?debug=1");
  await page.getByRole("button", { name: "Estimate position" }).click();
  const debugToggle = page.getByRole("button", { name: "Open debug telemetry" });
  if (await debugToggle.isVisible()) await debugToggle.click();
  await page.getByRole("button", { name: "TRIGGER DEBRIEF" }).click();
  await expect(page.getByRole("heading", { name: "Run debrief" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("session only");
  await page.getByRole("link", { name: "Open X-Ray replay" }).click();
  await expect(page.getByRole("heading", { name: "X-Ray replay" })).toBeVisible();
  await expect(page.getByText(/This replay is available for this session only/)).toBeVisible();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download replay JSON" }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/^echo-replay-\d+\.json$/);
});

test("unavailable clipboard offers a selectable seed without crashing the run", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new DOMException("Denied", "NotAllowedError")) } });
  });
  await page.goto("/play");
  await page.getByRole("button", { name: "Estimate position" }).click();
  await page.getByRole("button", { name: "Copy seed" }).click();
  await expect(page.getByText("Copy unavailable — select the seed below")).toBeVisible();
  await expect(page.locator("code")).toHaveText("ECHO-482951");
  await page.getByRole("button", { name: "Move north" }).click();
  await expect(page.getByText("Listen without giving much away.")).toBeVisible();
});

test("percent characters in a missing replay ID produce the normal empty state", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/replay/missing%25ZZ");
  await expect(page.getByText("No replay found")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open run history" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile layout keeps primary actions reachable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile-only assertion");
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Enter the dark" })).toBeVisible();
  await page.goto("/play");
  await page.getByRole("button", { name: "Estimate position" }).click();
  await expect(page.getByRole("button", { name: /Active sonar/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Move north" })).toBeVisible();
});
