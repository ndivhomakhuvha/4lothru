import { test, expect } from "@playwright/test";

const GUIDE_URL = "http://localhost:3001/payments/new?trail=PAY-1245&release=2026.08.26";

test.describe("Demo app — PAY-1245 guided flow", () => {
  test("SDK detects the guide and highlights the first target (spec #5, #6, #7)", async ({ page }) => {
    await page.goto(GUIDE_URL);

    await expect(page.locator(".tg-panel")).toBeVisible();
    await expect(page.locator(".tg-progress-text")).toHaveText("Step 1 of 4");
    await expect(page.locator(".tg-instruction")).toHaveText("Enter 1000 into the amount field.");
    await expect(page.locator(".tg-spotlight")).toBeVisible();

    const spotlightBox = await page.locator(".tg-spotlight").boundingBox();
    const amountBox = await page.locator("#amount").boundingBox();
    expect(spotlightBox).not.toBeNull();
    expect(amountBox).not.toBeNull();
    expect(Math.abs(spotlightBox!.x - amountBox!.x)).toBeLessThan(20);
  });

  test("blocks interaction outside the highlighted target", async ({ page }) => {
    await page.goto(GUIDE_URL);

    const dashboard = page.getByRole("link", { name: "Dashboard" });
    const dashboardBox = await dashboard.boundingBox();
    expect(dashboardBox).not.toBeNull();

    await page.mouse.click(dashboardBox!.x + 5, dashboardBox!.y + 5);
    await expect(page).toHaveURL(/\/payments\/new/);
  });

  test("Next remains disabled until the required action is completed", async ({ page }) => {
    await page.goto(GUIDE_URL);

    await expect(page.locator(".tg-progress-text")).toHaveText("Step 1 of 4");
    await expect(page.locator(".tg-back-btn")).toBeDisabled();
    await expect(page.locator(".tg-next-btn")).toBeDisabled();

    await page.locator("#amount").fill("999");
    await expect(page.locator(".tg-next-btn")).toBeDisabled();

    await page.locator("#amount").fill("1000");
    await expect(page.locator(".tg-next-btn")).toBeEnabled();

    await page.locator(".tg-next-btn").click();
    await expect(page.locator(".tg-progress-text")).toHaveText("Step 2 of 4");
    await expect(page.locator(".tg-instruction")).toHaveText("Select the beneficiary.");

    await expect(page.locator(".tg-next-btn")).toBeDisabled();
    await page.getByRole("button", { name: "Beneficiary" }).click();
    await expect(page.locator(".tg-next-btn")).toBeEnabled();

    await page.locator(".tg-back-btn").click();
    await expect(page.locator(".tg-progress-text")).toHaveText("Step 1 of 4");
  });

  test("completes the full guide end to end (spec #10-16)", async ({ page }) => {
    await page.goto(GUIDE_URL);

    // Step 1: input the amount (tester performs the real action; SDK only highlights).
    await expect(page.locator(".tg-instruction")).toHaveText("Enter 1000 into the amount field.");
    await page.locator("#amount").fill("1000");
    await page.locator(".tg-next-btn").click();

    // Step 2: select the beneficiary.
    await expect(page.locator(".tg-instruction")).toHaveText("Select the beneficiary.");
    await page.getByRole("button", { name: "Beneficiary" }).click();
    await expect(page.getByText("Selected: Jane Doe")).toBeVisible();
    await page.locator(".tg-next-btn").click();

    // Step 3: submit the payment (triggers an SPA route change to /payments/success).
    await expect(page.locator(".tg-instruction")).toHaveText("Submit the payment.");
    await page.getByRole("button", { name: "Submit Payment" }).click();
    await page.locator(".tg-next-btn").click();

    // Step 4: verify the dynamically-rendered success message, reached via SPA navigation.
    await expect(page.locator(".tg-progress-text")).toHaveText("Step 4 of 4");
    await expect(page.locator(".tg-instruction")).toHaveText("Verify that the payment was successful.");
    await expect(page).toHaveURL(/\/payments\/success/);
    await expect(page.getByRole("heading", { name: "Payment successful" })).toBeVisible();
    await expect(page.locator(".tg-spotlight")).toBeVisible();

    // Finish the guide.
    await expect(page.locator(".tg-next-btn")).toHaveText("Finish");
    await expect(page.locator(".tg-next-btn")).toBeEnabled();
    await page.locator(".tg-next-btn").click();

    await expect(page.getByText("Trail Guide Complete")).toBeVisible();
    await expect(page.getByText("4 of 4 steps completed.")).toBeVisible();

    await page.getByRole("button", { name: "Restart" }).click();
    await expect(page).toHaveURL(/\/payments\/new\?trail=PAY-1245&release=2026\.08\.26/);
    await expect(page.locator(".tg-progress-text")).toHaveText("Step 1 of 4");
    await expect(page.locator(".tg-instruction")).toHaveText("Enter 1000 into the amount field.");
  });
});
