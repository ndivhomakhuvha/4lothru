import { test, expect } from "@playwright/test";

const AMOUNT_GUIDE_URL = "http://localhost:3001/payments/new?trail=PAY-1245&release=2026.08.26";
// The Dashboard guide's first step uses action "verify", so Next is enabled immediately
// (no dependency on a required user action), giving a stable multi-control dialog to test.
const VERIFY_GUIDE_URL = "http://localhost:3001/?trail=DASHBOARD&release=2026.08.26";

test.describe("Overlay keyboard focus trap", () => {
  test("dialog panel receives focus when the guide opens", async ({ page }) => {
    await page.goto(AMOUNT_GUIDE_URL);

    await expect(page.locator(".tg-panel")).toBeVisible();
    await expect(page.locator(".tg-panel")).toBeFocused();
    await expect(page.locator(".tg-panel")).toHaveAttribute("role", "dialog");
    await expect(page.locator(".tg-panel")).not.toHaveAttribute("aria-modal");
  });

  test("Tab cycles focus only among controls inside the dialog", async ({ page }) => {
    await page.goto(VERIFY_GUIDE_URL);

    await expect(page.locator(".tg-next-btn")).toBeEnabled();

    await page.keyboard.press("Tab");
    await expect(page.locator(".tg-exit-btn")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator(".tg-next-btn")).toBeFocused();

    // Tabbing past the last focusable control wraps back to the first.
    await page.keyboard.press("Tab");
    await expect(page.locator(".tg-exit-btn")).toBeFocused();
  });

  test("Shift+Tab from the first control wraps to the last control", async ({ page }) => {
    await page.goto(VERIFY_GUIDE_URL);

    await expect(page.locator(".tg-next-btn")).toBeEnabled();

    await page.keyboard.press("Tab");
    await expect(page.locator(".tg-exit-btn")).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(page.locator(".tg-next-btn")).toBeFocused();
  });

  test("Tab from the initially focused panel reaches the guided target", async ({ page }) => {
    await page.goto(AMOUNT_GUIDE_URL);

    await page.keyboard.press("Tab");
    await expect(page.locator("#amount")).toBeFocused();
  });

  test("Shift+Tab from the initially focused panel wraps to the last control", async ({ page }) => {
    await page.goto(VERIFY_GUIDE_URL);

    await expect(page.locator(".tg-next-btn")).toBeEnabled();

    await page.keyboard.press("Shift+Tab");
    await expect(page.locator(".tg-next-btn")).toBeFocused();
  });

  test("Tab cycles through the guided target and dialog controls", async ({ page }) => {
    await page.goto(AMOUNT_GUIDE_URL);

    await page.keyboard.press("Tab");
    await expect(page.locator("#amount")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator(".tg-exit-btn")).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(page.locator("#amount")).toBeFocused();
  });

  test("focus outside the guided target and dialog is redirected to the target", async ({ page }) => {
    await page.goto(AMOUNT_GUIDE_URL);

    const dashboardLink = page.getByRole("link", { name: "Dashboard" });

    // Try to force focus onto a background element and press Tab: focus must stay in the dialog.
    await dashboardLink.evaluate((el: HTMLElement) => el.focus());
    await page.keyboard.press("Tab");

    await expect(dashboardLink).not.toBeFocused();
    await expect(page.locator("#amount")).toBeFocused();
  });

  test("Escape exits the guide", async ({ page }) => {
    await page.goto(AMOUNT_GUIDE_URL);

    await expect(page.locator(".tg-panel")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".tg-panel")).toHaveCount(0);
  });

  test("body scrolling is locked while the guide is active", async ({ page }) => {
    await page.goto(AMOUNT_GUIDE_URL);

    await expect(page.locator(".tg-panel")).toBeVisible();
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe("hidden");

    await page.keyboard.press("Escape");
    await expect(page.locator(".tg-panel")).toHaveCount(0);

    const restoredOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(restoredOverflow).not.toBe("hidden");
  });
});
