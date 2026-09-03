import { test, expect } from "@playwright/test";

test.describe("Viewer", () => {
  test("loads a guide and shows its metadata (spec #13)", async ({ page }) => {
    await page.goto("http://localhost:5173/g/2026.08.26/PAY-1245");

    await expect(page.getByRole("heading", { name: "Create a Payment" })).toBeVisible();
    await expect(page.getByText("2026.08.26")).toBeVisible();
    await expect(page.getByText("4 test steps")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Test" })).toBeVisible();
  });

  test("Start Test opens the configured application with guide params (spec #14)", async ({ page }) => {
    await page.goto("http://localhost:5173/g/2026.08.26/PAY-1245");
    await page.getByRole("button", { name: "Start Test" }).click();

    await page.waitForURL(/localhost:3001\/payments\/new\?.*trail=PAY-1245/);
    expect(page.url()).toContain("release=2026.08.26");
  });

  test("shows a clear error for a guide that doesn't exist (spec #26)", async ({ page }) => {
    await page.goto("http://localhost:5173/g/2026.08.26/DOES-NOT-EXIST");
    await expect(page.getByRole("heading", { name: "Trail Guide Not Found" })).toBeVisible();
  });
});
