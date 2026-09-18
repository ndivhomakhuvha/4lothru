import { test, expect } from "@playwright/test";

const GUIDE_URL = "http://localhost:3002/?trail=NG-1&release=2026.08.26";

test.describe("Angular compatibility (spec #17)", () => {
  test("the same @trail-cli/sdk drives a guide inside an Angular app", async ({ page }) => {
    await page.goto(GUIDE_URL);

    await expect(page.locator(".tg-progress-text")).toHaveText("Step 1 of 4");
    await page.locator("#amount").fill("500");
    await page.locator(".tg-next-btn").click();

    await expect(page.locator(".tg-instruction")).toHaveText("Select the beneficiary.");
    await page.getByRole("button", { name: "Beneficiary" }).click();
    await page.locator(".tg-next-btn").click();

    await expect(page.locator(".tg-instruction")).toHaveText("Submit the payment.");
    await page.getByRole("button", { name: "Submit Payment" }).click();
    await page.locator(".tg-next-btn").click();

    // "Payment successful" only appears after Angular re-renders on submit (dynamic target).
    await expect(page.getByRole("heading", { name: "Payment successful" })).toBeVisible();
    await expect(page.locator(".tg-progress-text")).toHaveText("Step 4 of 4");

    await page.locator(".tg-next-btn").click();
    await expect(page.getByText("Trail Guide Complete")).toBeVisible();
  });
});
