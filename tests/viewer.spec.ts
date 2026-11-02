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
    await expect(page.getByRole("heading", { name: "4lothru Guide Not Found" })).toBeVisible();
  });

  test("distinguishes a guide server error from a missing guide", async ({ page }) => {
    await page.route("**/guides/releases/2026.08.26/PAY-1245.json", (route) =>
      route.fulfill({ status: 500 }),
    );
    await page.goto("http://localhost:5173/g/2026.08.26/PAY-1245");

    await expect(page.getByRole("heading", { name: "Unable to Load 4lothru Guide" })).toBeVisible();
    await expect(page.getByText("The guide server returned an error. Try again later.")).toBeVisible();
  });

  test("distinguishes a network error from a missing guide", async ({ page }) => {
    await page.route("**/guides/releases/2026.08.26/PAY-1245.json", (route) => route.abort("failed"));
    await page.goto("http://localhost:5173/g/2026.08.26/PAY-1245");

    await expect(page.getByRole("heading", { name: "Unable to Load 4lothru Guide" })).toBeVisible();
    await expect(
      page.getByText("A network error prevented this guide from loading. Check your connection and try again."),
    ).toBeVisible();
  });
});
