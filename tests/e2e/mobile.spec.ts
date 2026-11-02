import { expect, test } from "@playwright/test";

async function horizontalOverflow(page: import("@playwright/test").Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("switches between setup and preview without overflowing", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("button", { name: "Set up" })).toBeVisible();
    await expect(page.locator(".controls")).toBeVisible();
    await expect(page.locator(".preview-panel")).toBeHidden();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

    await page.getByRole("button", { name: "Preview", exact: true }).click();

    await expect(page.locator(".preview-panel")).toBeVisible();
    await expect(page.locator(".controls")).toBeHidden();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test("fits a 320px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/");

    await expect(page.getByRole("button", { name: "Download PDF" })).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
});
