import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

const fixture = path.join(import.meta.dirname, "fixtures", "design.svg");

async function uploadArtwork(page: import("@playwright/test").Page) {
  await page.locator("#artwork-file").setInputFiles(fixture);
  await expect(page.getByText("Estimated print resolution")).toBeVisible();
}

async function downloadPdf(page: import("@playwright/test").Page) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download PDF" }).click(),
  ]);
  const filePath = await download.path();
  if (!filePath) throw new Error("Download did not produce a file.");
  return new Uint8Array(await readFile(filePath));
}

test("exports an exact A4 sheet with the expected grid", async ({ page }) => {
  await page.goto("/");
  await uploadArtwork(page);

  await page.getByRole("button", { name: "Fill sheet (15)" }).click();
  await expect(page.locator(".sheet-slot img")).toHaveCount(15);

  const bytes = await downloadPdf(page);
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBe(1);
  expect(pdf.getPage(0).getWidth()).toBeCloseTo(595.2756, 3);
  expect(pdf.getPage(0).getHeight()).toBeCloseTo(841.8898, 3);
});

test("splits 20 copies across two pages", async ({ page }) => {
  await page.goto("/");
  await uploadArtwork(page);

  await page.getByLabel("Copies").fill("20");
  await expect(page.locator(".page-counter")).toHaveText("1 / 2");
  await expect(page.locator(".sheet-slot img")).toHaveCount(15);
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.locator(".sheet-slot img")).toHaveCount(5);

  const bytes = await downloadPdf(page);
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBe(2);
});

test("supports custom paper entered in centimetres", async ({ page }) => {
  await page.goto("/");
  await uploadArtwork(page);

  await page.getByLabel("Paper", { exact: true }).selectOption("custom");
  await page.getByRole("button", { name: "cm", exact: true }).click();
  await page.getByLabel("Width").fill("12");
  await page.getByLabel("Height").fill("18");
  await page.getByLabel("Margin").fill("5");
  await page.getByLabel("Copies").fill("1");

  await page.getByLabel("Paper", { exact: true }).selectOption("a4");
  await page.getByLabel("Paper", { exact: true }).selectOption("custom");
  await expect(page.getByLabel("Width")).toHaveValue("12");
  await expect(page.getByLabel("Height")).toHaveValue("18");

  const bytes = await downloadPdf(page);
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBe(1);
  expect(pdf.getPage(0).getWidth()).toBeCloseTo(340.1575, 3);
  expect(pdf.getPage(0).getHeight()).toBeCloseTo(510.2362, 3);
});

test("switches to the 25 mm preset and keeps settings after reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /25 mm/ }).click();
  await expect(page.locator(".dimension-value").first()).toContainText("25");
  await expect(page.locator(".readout-strip").getByText("35", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.locator(".dimension-value").first()).toContainText("25");
  await expect(page.getByText("Drop your design here")).toBeVisible();
});

test("shows the finished face without the wrap ring", async ({ page }) => {
  await page.goto("/");
  await uploadArtwork(page);
  await page.getByRole("button", { name: "Finished face" }).click();
  await expect(page.getByText(/Enlarged to fill the view/)).toBeVisible();
  await expect(page.locator(".ring-cut")).toHaveCount(0);
});

test("exports a single-badge test sheet", async ({ page }) => {
  await page.goto("/");
  await uploadArtwork(page);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Test print" }).click(),
  ]);
  expect(download.suggestedFilename()).toContain("test-print");
  const filePath = await download.path();
  if (!filePath) throw new Error("Test print did not produce a file.");

  const pdf = await PDFDocument.load(new Uint8Array(await readFile(filePath)));
  expect(pdf.getPageCount()).toBe(1);
  expect(pdf.getPage(0).getWidth()).toBeCloseTo(595.2756, 3);
});

test("makes no external requests while designing and exporting", async ({ page }) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith("http") && !url.startsWith("http://127.0.0.1")) {
      externalRequests.push(url);
    }
  });

  await page.goto("/");
  await uploadArtwork(page);
  await downloadPdf(page);

  expect(externalRequests).toEqual([]);
});
