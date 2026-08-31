import { test, expect } from "@playwright/test";

test.describe("Missing target handling (spec #11, #15, #26)", () => {
  test("shows a clear error when the target can't be found on the page", async ({ page }) => {
    test.setTimeout(20_000);

    // Guide expects the "Amount" field, but we land on the Dashboard, which doesn't have one.
    await page.goto("http://localhost:3001/?testGuide=PAY-1245&release=2026.08.26");

    await expect(page.getByRole("heading", { name: "Target Not Found" })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".tg-instruction")).toContainText("could not be located");
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  });
});
