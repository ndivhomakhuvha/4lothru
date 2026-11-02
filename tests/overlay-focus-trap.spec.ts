import { test, expect } from "@playwright/test";

const AMOUNT_GUIDE_URL = "http://localhost:3001/payments/new?trail=PAY-1245&release=2026.08.26";
// The transaction-history guide's first step uses action "verify", so Next is enabled immediately

// (no dependency on a required user action), giving a stable multi-control dialog to test.
const VERIFY_GUIDE_URL = "http://localhost:3001/transactions?trail=PAY-1261&release=2026.08.26";


test.describe("Overlay keyboard focus trap", () => {
  test("dialog panel exposes screen-reader semantics and receives focus when the guide opens", async ({ page }) => {
    await page.goto(AMOUNT_GUIDE_URL);

    const dialog = page.getByRole("dialog", { name: "4lothru guide" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toBeFocused();
    await expect(dialog).toHaveAttribute("aria-live", "polite");
    await expect(dialog).not.toHaveAttribute("aria-modal");
    await expect(dialog.getByRole("button", { name: "Exit 4lothru guide" })).toBeVisible();
  });

  test("Tab cycles through the transaction-history target and dialog controls", async ({ page }) => {
    await page.goto(VERIFY_GUIDE_URL);

    await expect(page.locator(".tg-next-btn")).toBeEnabled();

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Transaction History" })).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator(".tg-exit-btn")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator(".tg-next-btn")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Transaction History" })).toBeFocused();
  });

  test("Shift+Tab from the first control wraps to the last control", async ({ page }) => {
    await page.goto(VERIFY_GUIDE_URL);

    await expect(page.locator(".tg-next-btn")).toBeEnabled();

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Transaction History" })).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(page.locator(".tg-next-btn")).toBeFocused();
  });

  test("Tab from the initially focused panel reaches the guided target", async ({ page }) => {
    await page.goto(AMOUNT_GUIDE_URL);

    await expect(page.locator(".tg-next-btn")).toBeVisible();
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

    await expect(page.locator(".tg-next-btn")).toBeVisible();
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

  test("locating a later target excludes the previous target from the focus scope", async ({ page }) => {
    await page.route("**/guides/releases/2026.08.26/PAY-1245.json", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          id: "PAY-1245",
          title: "Create a Payment",
          application: "demo-bank",
          release: "2026.08.26",
          start: { url: "http://localhost:3001/payments/new" },
          steps: [
            {
              id: "amount",
              action: "input",
              target: { label: "Amount" },
              value: "1000",
              autoAdvance: true,
              instruction: "Enter 1000 into the amount field.",
            },
            {
              id: "missing",
              action: "wait",
              target: { selector: "#missing-target" },
              timeoutMs: 1,
              instruction: "Wait for a missing target.",
            },
          ],
        }),
      });
    });
    await page.goto(AMOUNT_GUIDE_URL);

    await page.locator("#amount").fill("1000");
    await expect(page.getByRole("heading", { name: "Target Not Found" })).toBeVisible();

    const dashboardLink = page.getByRole("link", { name: "Dashboard" });
    await dashboardLink.evaluate((el: HTMLElement) => el.focus());
    await page.keyboard.press("Tab");

    await expect(page.locator(".tg-exit-btn")).toBeFocused();
  });

  test("Escape exits the guide and restores page interaction", async ({ page }) => {
    await page.goto(AMOUNT_GUIDE_URL);

    await expect(page.locator(".tg-panel")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".tg-panel")).toHaveCount(0);
    await expect(page.locator("#amount")).toBeEditable();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
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
